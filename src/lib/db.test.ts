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
    await saveSettings({ apiKey: "sk-test", kcalGoal: 2100 }, db);
    const stored = await getSettings(db);
    expect(stored.apiKey).toBe("sk-test");
    expect(stored.kcalGoal).toBe(2100);
    expect(stored.proteinGoal).toBe(DEFAULT_SETTINGS.proteinGoal);
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
