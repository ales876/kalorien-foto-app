import { describe, expect, it } from "vitest";
import {
  createDatabase,
  getSettings,
  saveSettings,
  upsertActivity,
  upsertMeasurement,
} from "./db";
import { DEFAULT_SETTINGS } from "./types";

describe("Einstellungen", () => {
  it("liefert Standardwerte und ergänzt gespeicherte", async () => {
    const db = createDatabase(`test-${Math.random()}`);
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
    // Unveränderte alte Ziele werden zu den neuen Standardwerten
    await db.settings.put({
      ...DEFAULT_SETTINGS,
      kcalGoal: 2000,
      proteinGoal: 130,
      carbsGoal: 200,
      fatGoal: 70,
      birthYear: 1986,
      heightCm: undefined,
      age: undefined,
    });
    const migrated = await getSettings(db);
    expect(migrated.kcalGoal).toBe(1650);
    expect(migrated.fatGoal).toBe(25);
    expect(migrated.heightCm).toBe(179);
    expect(migrated.age).toBe(new Date().getFullYear() - 1986);
    await saveSettings({ apiKey: "sk-test", kcalGoal: 2100 }, db);
    const stored = await getSettings(db);
    expect(stored.apiKey).toBe("sk-test");
    expect(stored.kcalGoal).toBe(2100);
    expect(stored.kcalGoal).toBe(2100);
  });
});

describe("Ein Wert pro Tag", () => {
  it("überschreibt Messungen desselben Tages, ohne Felder zu verlieren", async () => {
    const db = createDatabase(`test-${Math.random()}`);
    await upsertMeasurement("2026-09-01", { weightKg: 75 }, db);
    await upsertMeasurement("2026-09-01", { waistCm: 90 }, db);
    await upsertMeasurement("2026-09-01", { weightKg: 74.5 }, db);
    const all = await db.measurements.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ weightKg: 74.5, waistCm: 90 });
  });

  it("ersetzt die Aktivität desselben Tages", async () => {
    const db = createDatabase(`test-${Math.random()}`);
    await upsertActivity("2026-09-01", 500, db);
    await upsertActivity("2026-09-01", 624, db);
    const all = await db.activities.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]?.kcal).toBe(624);
  });
});
