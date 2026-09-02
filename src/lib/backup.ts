import { db, upsertMeasurement } from "./db";
import type { BodyMeasurement, FoodEntry } from "./types";
import { APP_VERSION } from "../version";

export interface BackupFile {
  version: string;
  entries: FoodEntry[];
  measurements: BodyMeasurement[];
}

export interface ImportResult {
  entries: number;
  measurements: number;
  skipped: number;
}

export async function exportBackup(): Promise<BackupFile> {
  const [entries, measurements] = await Promise.all([
    db.entries.toArray(),
    db.measurements.toArray(),
  ]);
  return { version: APP_VERSION, entries, measurements };
}

function isFoodEntry(value: unknown): value is FoodEntry {
  const entry = value as FoodEntry;
  return (
    typeof entry?.date === "string" &&
    typeof entry?.name === "string" &&
    typeof entry?.grams === "number" &&
    typeof entry?.kcalPer100g === "number"
  );
}

function isMeasurement(value: unknown): value is BodyMeasurement {
  const m = value as BodyMeasurement;
  return (
    typeof m?.date === "string" &&
    (typeof m?.weightKg === "number" || typeof m?.waistCm === "number")
  );
}

/** Importiert ein Backup. Doppelte Einträge werden übersprungen, damit ein
 *  versehentlich zweimal eingespielter Import nichts verdoppelt. */
export async function importBackup(raw: string): Promise<ImportResult> {
  let parsed: Partial<BackupFile>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }

  const entries = (parsed.entries ?? []).filter(isFoodEntry);
  const measurements = (parsed.measurements ?? []).filter(isMeasurement);

  if (entries.length === 0 && measurements.length === 0) {
    throw new Error("Die Datei enthält keine verwertbaren Daten.");
  }

  const existing = await db.entries.toArray();
  const fingerprint = (entry: FoodEntry) =>
    `${entry.date}|${entry.name}|${entry.grams}|${entry.kcalPer100g}`;
  const known = new Set(existing.map(fingerprint));

  let skipped = 0;
  const toAdd: Omit<FoodEntry, "id">[] = [];
  for (const entry of entries) {
    if (known.has(fingerprint(entry))) {
      skipped++;
      continue;
    }
    known.add(fingerprint(entry));
    // Fremde IDs nicht übernehmen — Dexie vergibt eigene.
    const { id: _ignored, ...rest } = entry;
    toAdd.push({ ...rest, timestamp: entry.timestamp ?? Date.now() });
  }

  if (toAdd.length > 0) await db.entries.bulkAdd(toAdd as FoodEntry[]);

  for (const m of measurements) {
    await upsertMeasurement(m.date, {
      weightKg: m.weightKg,
      waistCm: m.waistCm,
    });
  }

  return {
    entries: toAdd.length,
    measurements: measurements.length,
    skipped,
  };
}
