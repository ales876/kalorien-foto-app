import { beforeEach, describe, expect, it } from "vitest";
import { entryFingerprint, exportBackup, importBackup } from "./backup";
import { createDatabase, type PlateDatabase } from "./db";

const validEntry = {
  date: "2026-09-01",
  meal: "fruehstueck",
  name: "Skyr",
  grams: 250,
  kcalPer100g: 63,
  proteinPer100g: 11,
  carbsPer100g: 4,
  fatPer100g: 0.2,
  source: "search",
};

describe("importBackup", () => {
  let db: PlateDatabase;

  beforeEach(() => {
    db = createDatabase(`test-${Math.random()}`);
  });

  it("lehnt Unlesbares ab", async () => {
    await expect(importBackup("{", db)).rejects.toThrow("kein gültiges JSON");
    await expect(importBackup("[]", db)).rejects.toThrow("Format");
    await expect(importBackup('{"entries":[]}', db)).rejects.toThrow(
      "keine verwertbaren Daten",
    );
  });

  it("importiert, überspringt Dubletten und verwirft kaputte Datensätze", async () => {
    const file = JSON.stringify({
      entries: [validEntry, { ...validEntry, id: 999 }, { name: "ohne Datum" }],
      measurements: [
        { date: "2026-09-01", weightKg: 74.5 },
        { date: "2026-09-01" },
      ],
      activities: [{ date: "2026-09-01", kcal: 624 }],
    });
    const result = await importBackup(file, db);
    expect(result).toEqual({
      entries: 1,
      measurements: 1,
      activities: 1,
      skipped: 1,
      invalid: 2,
    });

    const entries = await db.entries.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).not.toBe(999);

    // Ein zweiter Import verdoppelt nichts.
    const again = await importBackup(file, db);
    expect(again.entries).toBe(0);
    expect(again.skipped).toBe(2);
    expect(await db.measurements.count()).toBe(1);
    expect(await db.activities.count()).toBe(1);
  });

  it("nimmt Altformate ohne activities-Feld", async () => {
    const result = await importBackup(
      JSON.stringify({
        version: "1.0.0",
        entries: [validEntry],
        measurements: [],
      }),
      db,
    );
    expect(result.entries).toBe(1);
  });
});

describe("exportBackup", () => {
  it("enthält alle Tabellen", async () => {
    const db = createDatabase(`test-${Math.random()}`);
    await db.entries.add({
      ...validEntry,
      meal: "snack",
      source: "manual",
      timestamp: 1,
    });
    const backup = await exportBackup(db);
    expect(backup.entries).toHaveLength(1);
    expect(backup.measurements).toEqual([]);
    expect(backup.activities).toEqual([]);
    expect(backup.version).toBeTypeOf("string");
  });
});

describe("entryFingerprint", () => {
  it("ignoriert die ID", () => {
    expect(
      entryFingerprint({
        date: "2026-09-01",
        name: "Skyr",
        grams: 250,
        kcalPer100g: 63,
      }),
    ).toBe("2026-09-01|Skyr|250|63");
  });
});
