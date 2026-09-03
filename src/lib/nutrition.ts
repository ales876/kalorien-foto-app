import { toDateKey } from "./date";
import type { FoodEntry, Meal, NutritionCandidate, Unit } from "./types";

export interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const EMPTY_TOTALS: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** kcal je Gramm Makronährstoff (Atwater-Faktoren). */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

/** Nährwerte eines Eintrags, hochgerechnet auf seine Grammzahl. */
export function entryTotals(entry: FoodEntry): Totals {
  const factor = entry.grams / 100;
  return {
    kcal: entry.kcalPer100g * factor,
    protein: entry.proteinPer100g * factor,
    carbs: entry.carbsPer100g * factor,
    fat: entry.fatPer100g * factor,
  };
}

export function addTotals(a: Totals, b: Totals): Totals {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function sumTotals(entries: readonly FoodEntry[]): Totals {
  return entries.reduce(
    (acc, entry) => addTotals(acc, entryTotals(entry)),
    EMPTY_TOTALS,
  );
}

export function kcalFor(kcalPer100g: number, grams: number): number {
  return Math.round((kcalPer100g * grams) / 100);
}

/** Gruppiert Einträge nach Tag — Grundlage für Wochenleiste und Berichte. */
export function groupByDate(
  entries: readonly FoodEntry[],
): Map<string, FoodEntry[]> {
  const groups = new Map<string, FoodEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.date);
    if (list) list.push(entry);
    else groups.set(entry.date, [entry]);
  }
  return groups;
}

const DRINK_WORDS = [
  "milch",
  "milk",
  "drink",
  "saft",
  "juice",
  "wasser",
  "water",
  "cola",
  "limo",
  "limonade",
  "schorle",
  "kaffee",
  "coffee",
  "latte",
  "cappuccino",
  "espresso",
  "tee",
  "tea",
  "bier",
  "beer",
  "wein",
  "wine",
  "sekt",
  "prosecco",
  "shake",
  "smoothie",
  "kefir",
  "buttermilch",
  "getränk",
  "getraenk",
  "beverage",
  "soda",
  "spezi",
  "eistee",
  "kakao",
  "cocoa",
  "energy",
  "radler",
  "brühe",
  "bruehe",
  "suppe",
  "sirup",
  "likör",
  "likoer",
  "gin",
  "wodka",
  "vodka",
  "whisky",
  "rum",
];
const DRINK_PATTERNS = [/\bml\b/, /\d\s*[,.]?\d*\s*l\b/, /\bliter\b/];

/** Getränke werden in ml geführt. Erkannt wird über den Namen — der
 *  Produktindex kennt keine Kategorien. Grenzfälle (Suppe, Joghurt-
 *  Drink) laufen bewusst als Getränk, weil man sie abmisst, nicht wiegt. */
export function guessUnit(name: string, brand = ""): Unit {
  const text = `${name} ${brand}`.toLowerCase();
  if (DRINK_PATTERNS.some((p) => p.test(text))) return "ml";
  const words = text.split(/[^a-zäöüß]+/);
  return words.some(
    (w) =>
      DRINK_WORDS.includes(w) ||
      DRINK_WORDS.some((d) => d.length > 4 && w.endsWith(d)),
  )
    ? "ml"
    : "g";
}

export function unitOf(item: { unit?: Unit | undefined }): Unit {
  return item.unit ?? "g";
}

export function candidateToEntry(
  candidate: NutritionCandidate,
  meal: Meal,
  grams: number,
  date: string = toDateKey(),
): FoodEntry {
  const entry: FoodEntry = {
    date,
    timestamp: Date.now(),
    meal,
    name: candidate.name,
    grams,
    kcalPer100g: candidate.kcalPer100g,
    proteinPer100g: candidate.proteinPer100g,
    carbsPer100g: candidate.carbsPer100g,
    fatPer100g: candidate.fatPer100g,
    source: candidate.source,
  };
  if (candidate.brand) entry.brand = candidate.brand;
  if (candidate.barcode) entry.barcode = candidate.barcode;
  if (candidate.thumb) entry.thumb = candidate.thumb;
  entry.unit = candidate.unit ?? guessUnit(candidate.name, candidate.brand);
  return entry;
}

/** Tageszeit als Vorauswahl für die Mahlzeit — spart meist einen Tap. */
export function guessMeal(date: Date = new Date()): Meal {
  const hour = date.getHours();
  if (hour < 10) return "fruehstueck";
  if (hour < 15) return "mittag";
  if (hour < 21) return "abend";
  return "snack";
}
