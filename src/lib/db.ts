import { Dexie, type EntityTable } from "dexie";
import {
  DEFAULT_SETTINGS,
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

export async function getSettings(
  database: AppDatabase = db,
): Promise<Settings> {
  const stored = await database.settings.get("settings");
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

export async function saveSettings(
  patch: Partial<Settings>,
  database: AppDatabase = db,
): Promise<void> {
  const current = await getSettings(database);
  await database.settings.put({ ...current, ...patch, id: "settings" });
}

export async function addEntries(
  entries: readonly FoodEntry[],
  database: AppDatabase = db,
): Promise<void> {
  await database.entries.bulkAdd(entries as FoodEntry[]);
}

export async function updateEntry(
  id: number,
  patch: Partial<Omit<FoodEntry, "id">>,
  database: AppDatabase = db,
): Promise<void> {
  await database.entries.update(id, patch);
}

export async function deleteEntry(
  id: number,
  database: AppDatabase = db,
): Promise<void> {
  await database.entries.delete(id);
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

  await database.transaction("rw", database.measurements, async () => {
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
  });
}

/** Ein Aktivitätswert pro Tag — die Health-App liefert ohnehin Tagessummen. */
export async function upsertActivity(
  date: string,
  kcal: number,
  database: AppDatabase = db,
): Promise<void> {
  await database.transaction("rw", database.activities, async () => {
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
  });
}
