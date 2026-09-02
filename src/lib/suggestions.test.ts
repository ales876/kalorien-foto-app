import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase, type AppDatabase } from "./db";
import {
  copyDay,
  copyMeal,
  findPreviousMeal,
  rankSuggestions,
} from "./suggestions";
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

describe("Übernehmen", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = createDatabase(`test-${Math.random()}`);
    await db.entries.bulkAdd([
      entry({ name: "Skyr", date: "2026-09-01" }),
      entry({ name: "Haferflocken", date: "2026-09-01" }),
      entry({ name: "Pasta", date: "2026-09-01", meal: "abend" }),
      entry({ name: "Altes Brot", date: "2026-08-20" }),
    ]);
  });

  it("findet die letzte gleichartige Mahlzeit vor einem Datum", async () => {
    const previous = await findPreviousMeal("fruehstueck", "2026-09-02", db);
    expect(previous?.date).toBe("2026-09-01");
    expect(previous?.entries.map((e) => e.name).sort()).toEqual([
      "Haferflocken",
      "Skyr",
    ]);
    expect(await findPreviousMeal("snack", "2026-09-02", db)).toBeNull();
  });

  it("kopiert eine Mahlzeit ohne IDs mitzunehmen", async () => {
    expect(await copyMeal("2026-09-01", "fruehstueck", "2026-09-02", db)).toBe(
      2,
    );
    const copied = await db.entries
      .where("date")
      .equals("2026-09-02")
      .toArray();
    expect(copied).toHaveLength(2);
    expect(new Set(copied.map((e) => e.id)).size).toBe(2);
  });

  it("kopiert einen ganzen Tag", async () => {
    expect(await copyDay("2026-09-01", "2026-09-02", db)).toBe(3);
    expect(await db.entries.where("date").equals("2026-09-02").count()).toBe(3);
  });
});
