import { Dexie, type EntityTable } from "dexie";
import {
  DEFAULT_SETTINGS,
  LEGACY_DEFAULT_GOALS,
  type Activity,
  type BodyMeasurement,
  type FoodEntry,
  type Settings,
} from "./types";

/** Der Datenbankname stammt aus der ersten Version und bleibt: unter ihm
 *  liegen die bestehenden Einträge auf dem Gerät. */
export const DB_NAME = "KcalScanner";

export type AppDatabase = Dexie & {
  entries: EntityTable<FoodEntry, "id">;
  measurements: EntityTable<BodyMeasurement, "id">;
  settings: EntityTable<Settings, "id">;
  activities: EntityTable<Activity, "id">;
};

export function createDatabase(name: string = DB_NAME): AppDatabase {
  const db = new Dexie(name) as AppDatabase;

  // Alte Schema-Versionen bleiben stehen — Dexie migriert vorhandene
  // Datenbanken damit automatisch hoch.
  db.version(1).stores({
    entries: "++id, date, meal, timestamp, barcode",
    measurements: "++id, date, timestamp",
    settings: "id",
  });
  db.version(2).stores({
    activities: "++id, date, timestamp",
  });

  return db;
}

export const db = createDatabase();

/** iOS schließt IndexedDB-Verbindungen, wenn die App länger im
 *  Hintergrund lag. Der nächste Zugriff wirft dann, obwohl die Daten in
 *  Ordnung sind. Deshalb: bei jedem Schließen wieder öffnen und beim
 *  Zurückkehren in den Vordergrund prüfen. */
export async function ensureOpen(database: AppDatabase = db): Promise<void> {
  if (database.isOpen()) return;
  try {
    await database.open();
  } catch (error) {
    console.error("Datenbank ließ sich nicht öffnen", error);
  }
}

db.on("close", () => {
  void ensureOpen();
});

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void ensureOpen();
  });
}

/** Führt eine Schreiboperation aus und öffnet die Verbindung einmal neu,
 *  falls sie zwischenzeitlich geschlossen wurde. Wirft der zweite
 *  Versuch auch, kommt der Fehler durch. */
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (db.isOpen()) throw error;
    await ensureOpen();
    return operation();
  }
}

export async function getSettings(
  database: AppDatabase = db,
): Promise<Settings> {
  const stored = await database.settings.get("settings");
  if (!stored) return DEFAULT_SETTINGS;
  const merged: Settings = { ...DEFAULT_SETTINGS, ...stored };
  // Unveränderte Ziele der ersten Version → neue Standardwerte.
  const untouched = (
    Object.keys(LEGACY_DEFAULT_GOALS) as (keyof typeof LEGACY_DEFAULT_GOALS)[]
  ).every((key) => stored[key] === LEGACY_DEFAULT_GOALS[key]);
  if (untouched) {
    merged.kcalGoal = DEFAULT_SETTINGS.kcalGoal;
    merged.proteinGoal = DEFAULT_SETTINGS.proteinGoal;
    merged.carbsGoal = DEFAULT_SETTINGS.carbsGoal;
    merged.fatGoal = DEFAULT_SETTINGS.fatGoal;
  }
  // Datensätze ohne Alter stammen aus der ersten Version: Körperdaten
  // einmalig auf die gewünschten Werte setzen (179 cm, 40 Jahre).
  if (stored.age === undefined) {
    merged.heightCm = DEFAULT_SETTINGS.heightCm;
    merged.age = DEFAULT_SETTINGS.age;
  }
  if (merged.sex === undefined) merged.sex = DEFAULT_SETTINGS.sex;
  return merged;
}

export async function saveSettings(
  patch: Partial<Settings>,
  database: AppDatabase = db,
): Promise<void> {
  const current = await getSettings(database);
  await withRetry(() =>
    database.settings.put({ ...current, ...patch, id: "settings" }),
  );
}

export async function addEntries(
  entries: readonly FoodEntry[],
  database: AppDatabase = db,
): Promise<void> {
  await withRetry(() => database.entries.bulkAdd(entries as FoodEntry[]));
}

export async function updateEntry(
  id: number,
  patch: Partial<Omit<FoodEntry, "id">>,
  database: AppDatabase = db,
): Promise<void> {
  await withRetry(() => database.entries.update(id, patch));
}

export async function deleteEntry(
  id: number,
  database: AppDatabase = db,
): Promise<void> {
  await withRetry(() => database.entries.delete(id));
}

/** Legt eine Kopie eines Eintrags an — an einem anderen Tag oder in
 *  einer anderen Mahlzeit. Das Original bleibt unverändert. */
export async function copyEntry(
  entry: FoodEntry,
  target: { date?: string; meal?: FoodEntry["meal"] },
  database: AppDatabase = db,
): Promise<void> {
  const { id: _drop, ...rest } = entry;
  await withRetry(() =>
    database.entries.add({ ...rest, ...target, timestamp: Date.now() }),
  );
}

/** Speichert Gewicht/Bauchumfang und überschreibt den Eintrag desselben
 *  Tages, statt Dubletten anzulegen. Nicht angegebene Werte bleiben. */
export async function upsertMeasurement(
  date: string,
  values: { weightKg?: number; waistCm?: number },
  database: AppDatabase = db,
): Promise<void> {
  const patch: Partial<BodyMeasurement> = { timestamp: Date.now() };
  if (values.weightKg !== undefined) patch.weightKg = values.weightKg;
  if (values.waistCm !== undefined) patch.waistCm = values.waistCm;

  await withRetry(() =>
    database.transaction("rw", database.measurements, async () => {
      const existing = await database.measurements
        .where("date")
        .equals(date)
        .first();
      if (existing?.id !== undefined) {
        await database.measurements.update(existing.id, patch);
      } else {
        await database.measurements.add({
          date,
          ...patch,
          timestamp: Date.now(),
        });
      }
    }),
  );
}

/** Ein Aktivitätswert pro Tag — die Health-App liefert ohnehin Tagessummen. */
export async function upsertActivity(
  date: string,
  kcal: number,
  database: AppDatabase = db,
): Promise<void> {
  await withRetry(() =>
    database.transaction("rw", database.activities, async () => {
      const existing = await database.activities
        .where("date")
        .equals(date)
        .first();
      if (existing?.id !== undefined) {
        await database.activities.update(existing.id, {
          kcal,
          timestamp: Date.now(),
        });
      } else {
        await database.activities.add({ date, kcal, timestamp: Date.now() });
      }
    }),
  );
}
