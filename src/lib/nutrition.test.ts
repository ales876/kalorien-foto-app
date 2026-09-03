import { describe, expect, it } from "vitest";
import {
  candidateToEntry,
  entryTotals,
  groupByDate,
  guessMeal,
  guessUnit,
  kcalFor,
  sumTotals,
} from "./nutrition";
import type { FoodEntry, NutritionCandidate } from "./types";

const skyr: FoodEntry = {
  date: "2026-09-02",
  timestamp: 0,
  meal: "fruehstueck",
  name: "Skyr",
  grams: 250,
  kcalPer100g: 63,
  proteinPer100g: 11,
  carbsPer100g: 4,
  fatPer100g: 0.2,
  source: "search",
};

describe("Nährwerte", () => {
  it("rechnet pro 100 g auf die Grammzahl hoch", () => {
    expect(entryTotals(skyr)).toEqual({
      kcal: 157.5,
      protein: 27.5,
      carbs: 10,
      fat: 0.5,
    });
  });

  it("summiert mehrere Einträge", () => {
    const totals = sumTotals([skyr, { ...skyr, grams: 100 }]);
    expect(totals.kcal).toBeCloseTo(220.5);
    expect(totals.protein).toBeCloseTo(38.5);
  });

  it("rundet kcal für die Anzeige", () => {
    expect(kcalFor(63, 250)).toBe(158);
  });

  it("gruppiert nach Tag", () => {
    const groups = groupByDate([
      skyr,
      { ...skyr, date: "2026-09-01" },
      { ...skyr },
    ]);
    expect(groups.get("2026-09-02")).toHaveLength(2);
    expect(groups.get("2026-09-01")).toHaveLength(1);
  });
});

describe("candidateToEntry", () => {
  it("übernimmt Nährwerte pro 100 g und lässt leere Felder weg", () => {
    const candidate: NutritionCandidate = {
      name: "Haferflocken",
      kcalPer100g: 370,
      proteinPer100g: 13,
      carbsPer100g: 59,
      fatPer100g: 7,
      suggestedGrams: 60,
      source: "search",
    };
    const entry = candidateToEntry(candidate, "fruehstueck", 80, "2026-09-01");
    expect(entry.grams).toBe(80);
    expect(entry.kcalPer100g).toBe(370);
    expect(entry.date).toBe("2026-09-01");
    expect("brand" in entry).toBe(false);
    expect("thumb" in entry).toBe(false);
  });
});

describe("guessMeal", () => {
  it("belegt die Mahlzeit nach Uhrzeit vor", () => {
    expect(guessMeal(new Date(2026, 8, 2, 7))).toBe("fruehstueck");
    expect(guessMeal(new Date(2026, 8, 2, 12))).toBe("mittag");
    expect(guessMeal(new Date(2026, 8, 2, 19))).toBe("abend");
    expect(guessMeal(new Date(2026, 8, 2, 22))).toBe("snack");
  });
});

describe("guessUnit", () => {
  it("erkennt Getränke am Namen", () => {
    expect(guessUnit("Hafermilch Kakao", "Oatly")).toBe("ml");
    expect(guessUnit("Skyr Natur", "Arla")).toBe("g");
    expect(guessUnit("Cola Zero 0,5 l")).toBe("ml");
    expect(guessUnit("Haferdrink ungesüßt")).toBe("ml");
    expect(guessUnit("Vollkornbrot")).toBe("g");
    expect(guessUnit("Kaffee mit Milch")).toBe("ml");
  });
});
