import { z } from "zod";
import { db, upsertActivity, upsertMeasurement, type AppDatabase } from "./db";
import {
  ENTRY_SOURCES,
  MEAL_IDS,
  type Activity,
  type BodyMeasurement,
  type FoodEntry,
} from "./types";
import { APP_VERSION } from "../version";

/** Backup-Dateien sind fremde Eingabe: alles wird geprüft, unbekannte
 *  Felder werden verworfen, kaputte Datensätze übersprungen. */
const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timestamp: z.number().optional(),
  meal: z.enum(MEAL_IDS).catch("snack"),
  name: z.string().min(1),
  brand: z.string().optional(),
  grams: z.number().nonnegative(),
  kcalPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative().catch(0),
  carbsPer100g: z.number().nonnegative().catch(0),
  fatPer100g: z.number().nonnegative().catch(0),
  source: z.enum(ENTRY_SOURCES as [string, ...string[]]).catch("import"),
  barcode: z.string().optional(),
  thumb: z.string().optional(),
});

const measurementSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weightKg: z.number().positive().optional(),
    waistCm: z.number().positive().optional(),
  })
  .refine((m) => m.weightKg !== undefined || m.waistCm !== undefined);

const activitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kcal: z.number().nonnegative(),
});

const backupSchema = z.object({
  version: z.string().optional(),
  entries: z.array(z.unknown()).default([]),
  measurements: z.array(z.unknown()).default([]),
  activities: z.array(z.unknown()).default([]),
});

export interface BackupFile {
  version: string;
  exportedAt: string;
  entries: FoodEntry[];
  measurements: BodyMeasurement[];
  activities: Activity[];
}

export interface ImportResult {
  entries: number;
  measurements: number;
  activities: number;
  skipped: number;
  invalid: number;
}

export async function exportBackup(
  database: AppDatabase = db,
): Promise<BackupFile> {
  const [entries, measurements, activities] = await Promise.all([
    database.entries.toArray(),
    database.measurements.toArray(),
    database.activities.toArray(),
  ]);
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
    measurements,
    activities,
  };
}

export function backupFileName(date: Date = new Date()): string {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `sunny-orbit-backup-${key}.json`;
}

/** Erkennt Dubletten unabhängig von der ID — ein zweimal eingespielter
 *  Import darf nichts verdoppeln. */
export function entryFingerprint(
  entry: Pick<FoodEntry, "date" | "name" | "grams" | "kcalPer100g">,
): string {
  return `${entry.date}|${entry.name}|${entry.grams}|${entry.kcalPer100g}`;
}

function collect<T>(
  schema: z.ZodType<T>,
  items: unknown[],
): { valid: T[]; invalid: number } {
  const valid: T[] = [];
  let invalid = 0;
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) valid.push(result.data);
    else invalid++;
  }
  return { valid, invalid };
}

export async function importBackup(
  raw: string,
  database: AppDatabase = db,
): Promise<ImportResult> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }

  const parsed = backupSchema.safeParse(json);
  if (!parsed.success)
    throw new Error(
      "Die Datei hat nicht das Format eines Sunny-Orbit-Backups.",
    );

  const entries = collect(entrySchema, parsed.data.entries);
  const measurements = collect(measurementSchema, parsed.data.measurements);
  const activities = collect(activitySchema, parsed.data.activities);
  const invalid = entries.invalid + measurements.invalid + activities.invalid;

  if (
    entries.valid.length === 0 &&
    measurements.valid.length === 0 &&
    activities.valid.length === 0
  ) {
    throw new Error("Die Datei enthält keine verwertbaren Daten.");
  }

  const known = new Set(
    (await database.entries.toArray()).map(entryFingerprint),
  );
  let skipped = 0;
  const toAdd: FoodEntry[] = [];
  for (const entry of entries.valid) {
    const key = entryFingerprint(entry);
    if (known.has(key)) {
      skipped++;
      continue;
    }
    known.add(key);
    // Fremde IDs nicht übernehmen — Dexie vergibt eigene.
    toAdd.push({
      ...entry,
      source: entry.source as FoodEntry["source"],
      timestamp: entry.timestamp ?? Date.now(),
    });
  }

  await database.transaction(
    "rw",
    [database.entries, database.measurements, database.activities],
    async () => {
      if (toAdd.length > 0) await database.entries.bulkAdd(toAdd);
      for (const m of measurements.valid)
        await upsertMeasurement(m.date, m, database);
      for (const a of activities.valid)
        await upsertActivity(a.date, a.kcal, database);
    },
  );

  return {
    entries: toAdd.length,
    measurements: measurements.valid.length,
    activities: activities.valid.length,
    skipped,
    invalid,
  };
}
