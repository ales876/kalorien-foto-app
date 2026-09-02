import { describe, expect, it } from "vitest";
import {
  assessDeficit,
  computeBMR,
  computeEnergyBalance,
  isBalanceGap,
  smoothWeights,
} from "./analysis";
import { lastNDays } from "./date";
import type { BodyMeasurement, FoodEntry } from "./types";

function day(date: string, kcal: number): FoodEntry {
  return {
    date,
    timestamp: 0,
    meal: "mittag",
    name: "Tag",
    grams: 100,
    kcalPer100g: kcal,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    source: "import",
  };
}

describe("computeEnergyBalance", () => {
  const today = "2026-08-28";
  const days = lastNDays(27, today); // 2026-08-02 … 2026-08-28

  it("misst den Erhaltungsbedarf aus Aufnahme und Gewichtsverlauf", () => {
    const first = days[0] ?? "";
    const last = days[26] ?? "";
    const entries = days.map((d) => day(d, 1912));
    const measurements: BodyMeasurement[] = [
      { date: first, timestamp: 0, weightKg: 76 },
      { date: last, timestamp: 0, weightKg: 74.5 },
    ];
    const result = computeEnergyBalance(entries, measurements, today);
    expect(isBalanceGap(result)).toBe(false);
    if (isBalanceGap(result)) return;
    expect(result.days).toBe(26);
    expect(result.weightChange).toBeCloseTo(-1.5);
    // Der laufende Tag zählt nicht mit.
    expect(result.loggedDays).toBe(26);
    expect(result.dailyBalance).toBeCloseTo(-403.85, 1);
    expect(Math.round(result.maintenance)).toBe(2316);
  });

  it("nennt, was fehlt, statt etwas zu behaupten", () => {
    expect(
      computeEnergyBalance(
        [],
        [{ date: today, timestamp: 0, weightKg: 75 }],
        today,
      ),
    ).toMatchObject({
      reason: "zu-wenig-wiegungen",
    });
    expect(
      computeEnergyBalance(
        [],
        [
          { date: "2026-08-20", timestamp: 0, weightKg: 75 },
          { date: "2026-08-28", timestamp: 0, weightKg: 74 },
        ],
        today,
      ),
    ).toMatchObject({ reason: "zu-kurzer-zeitraum" });
    expect(
      computeEnergyBalance(
        days.slice(0, 5).map((d) => day(d, 2000)),
        [
          { date: days[0] ?? "", timestamp: 0, weightKg: 75 },
          { date: days[26] ?? "", timestamp: 0, weightKg: 74 },
        ],
        today,
      ),
    ).toMatchObject({ reason: "zu-wenig-tage" });
  });
});

describe("smoothWeights", () => {
  it("glättet über sieben Kalendertage", () => {
    const points = smoothWeights([
      { date: "2026-09-01", timestamp: 0, weightKg: 75 },
      { date: "2026-09-02", timestamp: 0, weightKg: 76 },
      { date: "2026-09-10", timestamp: 0, weightKg: 74 },
    ]);
    expect(points.map((p) => p.trend)).toEqual([75, 75.5, 74]);
  });
});

describe("Grundumsatz und Defizit", () => {
  it("rechnet Mifflin-St Jeor", () => {
    expect(
      computeBMR({ weightKg: 74.5, heightCm: 180, age: 35, sex: "m" }),
    ).toBeCloseTo(1700);
    expect(
      computeBMR({ weightKg: 74.5, heightCm: 180, age: 35, sex: "w" }),
    ).toBeCloseTo(1534);
  });

  it("ordnet das Defizit ein", () => {
    expect(assessDeficit(2000, 2300, 1700)).toMatchObject({
      deficit: 300,
      label: "moderat",
      belowBMR: false,
    });
    expect(assessDeficit(1600, 2300, 1700).belowBMR).toBe(true);
    expect(assessDeficit(2500, 2300).label).toBe("Aufbau");
    expect(assessDeficit(1500, 2300).label).toBe("aggressiv");
  });
});
