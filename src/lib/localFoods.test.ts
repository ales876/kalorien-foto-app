import { describe, expect, it } from "vitest";
import { normalize, searchIndex, type IndexEntry } from "./localFoods";

const index: IndexEntry[] = [
  { c: "1", n: "Fromage Blanc", b: "Danone", k: 50, p: 8, ch: 4, f: 0.2 },
  { c: "2", n: "Skyr Natur", b: "Arla", k: 63, p: 11, ch: 4, f: 0.2 },
  { c: "3", n: "Bio Skyr", b: "Milbona", k: 60, p: 10, ch: 4, f: 0.2 },
  { c: "4", n: "Müsli Classic", b: "Kölln", k: 370, p: 10, ch: 60, f: 7 },
  { c: "5", n: "Skyr", b: "", k: 62, p: 11, ch: 4, f: 0.2 },
];

describe("normalize", () => {
  it("vereinheitlicht Umlaute und Akzente", () => {
    expect(normalize("Müsli")).toBe("muesli");
    expect(normalize("Crème")).toBe("creme");
  });
});

describe("searchIndex", () => {
  it("rangiert exakt vor Anfang vor Wortanfang vor Marke", () => {
    const names = searchIndex(index, "skyr").map((c) => c.name);
    expect(names).toEqual(["Skyr", "Skyr Natur", "Bio Skyr"]);
  });

  it("findet Müsli auch als Muesli", () => {
    expect(searchIndex(index, "muesli")[0]?.name).toBe("Müsli Classic");
  });

  it("findet über die Marke", () => {
    expect(searchIndex(index, "danone")[0]?.name).toBe("Fromage Blanc");
  });

  it("verlangt mindestens zwei Zeichen", () => {
    expect(searchIndex(index, "s")).toEqual([]);
  });

  it("liefert Kandidaten pro 100 g", () => {
    const [hit] = searchIndex(index, "skyr natur");
    expect(hit).toMatchObject({
      kcalPer100g: 63,
      suggestedGrams: 100,
      barcode: "2",
      brand: "Arla",
      source: "search",
    });
  });
});
