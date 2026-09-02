import Dexie, { type EntityTable } from "dexie";
import {
  DEFAULT_SETTINGS,
  type Activity,
  type BodyMeasurement,
  type FoodEntry,
  type Settings,
} from "./types";

const db = new Dexie("KcalScanner") as Dexie & {
  entries: EntityTable<FoodEntry, "id">;
  measurements: EntityTable<BodyMeasurement, "id">;
  settings: EntityTable<Settings, "id">;
  activities: EntityTable<Activity, "id">;
};

// Schema-Versionen bleiben stehen, wenn sich das Modell ändert — Dexie
// migriert bestehende Daten dann automatisch hoch.
db.version(1).stores({
  entries: "++id, date, meal, timestamp, barcode",
  measurements: "++id, date, timestamp",
  settings: "id",
});

// Aktivitäten kamen später dazu; Dexie migriert bestehende Daten selbst.
db.version(2).stores({
  activities: "++id, date, timestamp",
});

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get("settings");
  return stored ?? DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: "settings" });
}

/** Speichert Gewicht/Bauchumfang und überschreibt einen bestehenden
 *  Eintrag desselben Tages, statt Dubletten anzulegen. */
export async function upsertMeasurement(
  date: string,
  values: { weightKg?: number; waistCm?: number },
): Promise<void> {
  const existing = await db.measurements.where("date").equals(date).first();
  if (existing) {
    await db.measurements.update(existing.id!, {
      ...values,
      timestamp: Date.now(),
    });
  } else {
    await db.measurements.add({ date, timestamp: Date.now(), ...values });
  }
}

/** Ein Aktivitätswert pro Tag — ein neuer überschreibt den alten,
 *  weil die Health-App ohnehin die Tagessumme liefert. */
export async function upsertActivity(
  date: string,
  kcal: number,
): Promise<void> {
  const existing = await db.activities.where("date").equals(date).first();
  if (existing) {
    await db.activities.update(existing.id!, { kcal, timestamp: Date.now() });
  } else {
    await db.activities.add({ date, kcal, timestamp: Date.now() });
  }
}

export { db };
