import type { FoodEntry, Meal, NutritionCandidate } from "./types";

export interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const EMPTY_TOTALS: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** Nährwerte eines einzelnen Eintrags, hochgerechnet auf seine Grammzahl. */
export function entryTotals(entry: FoodEntry): Totals {
  const factor = entry.grams / 100;
  return {
    kcal: entry.kcalPer100g * factor,
    protein: entry.proteinPer100g * factor,
    carbs: entry.carbsPer100g * factor,
    fat: entry.fatPer100g * factor,
  };
}

export function sumTotals(entries: FoodEntry[]): Totals {
  return entries.reduce<Totals>((acc, entry) => {
    const t = entryTotals(entry);
    return {
      kcal: acc.kcal + t.kcal,
      protein: acc.protein + t.protein,
      carbs: acc.carbs + t.carbs,
      fat: acc.fat + t.fat,
    };
  }, EMPTY_TOTALS);
}

/** Lokales Datum als YYYY-MM-DD — bewusst nicht toISOString(),
 *  das würde in UTC umrechnen und nachts den Tag verschieben. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateKey(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

export function shortDate(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}.${m}.`;
}

/** Alle Tagesschlüssel der letzten n Tage, ältester zuerst. */
export function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

export function candidateToEntry(
  candidate: NutritionCandidate,
  meal: FoodEntry["meal"],
  grams: number,
): Omit<FoodEntry, "id"> {
  return {
    date: toDateKey(),
    timestamp: Date.now(),
    meal,
    name: candidate.name,
    brand: candidate.brand,
    grams,
    kcalPer100g: candidate.kcalPer100g,
    proteinPer100g: candidate.proteinPer100g,
    carbsPer100g: candidate.carbsPer100g,
    fatPer100g: candidate.fatPer100g,
    source: candidate.source,
    barcode: candidate.barcode,
    thumb: candidate.thumb,
  };
}

/** Ganze Zahl in deutscher Schreibweise: 1234 wird zu „1.234". */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("de-DE");
}

/** Dezimalzahl mit Komma statt Punkt: 84.5 wird zu „84,5". */
export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Tageszeit als Vorauswahl für die Mahlzeit — spart bei den meisten
 *  Einträgen einen Tap. */
export function guessMeal(date = new Date()): Meal {
  const hour = date.getHours();
  if (hour < 10) return "fruehstueck";
  if (hour < 15) return "mittag";
  if (hour < 21) return "abend";
  return "snack";
}
