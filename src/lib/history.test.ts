import { describe, expect, it } from "vitest";
import { searchHistoryEntries } from "./history";
import type { FoodEntry } from "./types";

function entry(
  partial: Partial<FoodEntry> & { name: string; date: string },
): FoodEntry {
  return {
    timestamp: 0,
    meal: "abend",
    grams: 100,
    kcalPer100g: 100,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    source: "search",
    ...partial,
  };
}

describe("searchHistoryEntries", () => {
  const entries = [
    entry({
      name: "Skyr Natur",
      brand: "Arla",
      date: "2026-08-01",
      grams: 200,
    }),
    entry({
      name: "Skyr Natur",
      brand: "Arla",
      date: "2026-08-20",
      grams: 250,
    }),
    entry({ name: "Bio Skyr", date: "2026-08-25" }),
    entry({ name: "Käse", brand: "Skyr Co", date: "2026-08-26" }),
    entry({ name: "Tagessumme", date: "2026-08-26", source: "import" }),
    entry({ name: "Pizza", date: "2026-08-26", source: "photo" }),
  ];

  it("fasst gleiche Lebensmittel zusammen und nimmt die letzte Menge", () => {
    const hits = searchHistoryEntries(entries, "skyr");
    expect(hits.map((h) => h.name)).toEqual(["Skyr Natur", "Bio Skyr", "Käse"]);
    expect(hits[0]).toMatchObject({
      count: 2,
      suggestedGrams: 250,
      lastUsed: "2026-08-20",
      brand: "Arla",
    });
  });

  it("findet auch Foto- und Handeinträge, aber keine Tagessummen", () => {
    expect(searchHistoryEntries(entries, "pizza")).toHaveLength(1);
    expect(searchHistoryEntries(entries, "tagessumme")).toHaveLength(0);
  });

  it("verlangt zwei Zeichen", () => {
    expect(searchHistoryEntries(entries, "s")).toEqual([]);
  });
});
