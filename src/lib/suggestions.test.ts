import { describe, expect, it } from "vitest";
import { rankSuggestions } from "./suggestions";
import type { FoodEntry } from "./types";

function entry(
  partial: Partial<FoodEntry> & { name: string; date: string },
): FoodEntry {
  return {
    timestamp: 0,
    meal: "fruehstueck",
    grams: 100,
    kcalPer100g: 100,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    source: "search",
    ...partial,
  };
}

describe("rankSuggestions", () => {
  const today = "2026-09-02";

  it("gewichtet Häufigkeit, Mahlzeit und Aktualität", () => {
    const entries = [
      entry({ name: "Skyr", date: "2026-09-01" }),
      entry({ name: "Skyr", date: "2026-08-31" }),
      entry({ name: "Skyr", date: "2026-08-30" }),
      entry({ name: "Pizza", date: "2026-09-01", meal: "abend" }),
      entry({ name: "Pizza", date: "2026-08-25", meal: "abend" }),
    ];
    const morning = rankSuggestions(entries, "fruehstueck", today);
    expect(morning.map((s) => s.name)).toEqual(["Skyr", "Pizza"]);
    expect(morning[0]?.count).toBe(3);
  });

  it("lässt heutige Einträge und Tagessummen aus", () => {
    const entries = [
      entry({ name: "Heute schon", date: today }),
      entry({ name: "FDDB-Tag", date: "2026-09-01", source: "import" }),
      entry({ name: "Brot", date: "2026-09-01" }),
    ];
    expect(
      rankSuggestions(entries, "fruehstueck", today).map((s) => s.name),
    ).toEqual(["Brot"]);
  });
});
