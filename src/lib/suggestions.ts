import { daysBetween, shiftDays, toDateKey } from "./date";
import { db, type AppDatabase } from "./db";
import type { FoodEntry, Meal, NutritionCandidate } from "./types";

/** Wie weit zurück Vorschläge gesucht werden. */
export const LOOKBACK_DAYS = 60;

export interface Suggestion extends NutritionCandidate {
  /** Wie oft im Zeitraum erfasst. */
  count: number;
  lastUsed: string;
}

function fingerprint(entry: FoodEntry): string {
  return `${entry.name}|${entry.brand ?? ""}|${entry.kcalPer100g}`;
}

/** Bewertet die Historie — reine Funktion, damit sie testbar bleibt.
 *
 *    score = Häufigkeit × 1,0 + gleiche Mahlzeit × 1,5 + max(0, 14 − Alter) × 0,2
 *
 *  Häufigkeit trägt am meisten, danach die passende Tageszeit, dann
 *  Aktualität: was letzte Woche dran war, eher als was im Juli dran war. */
export function rankSuggestions(
  entries: readonly FoodEntry[],
  meal: Meal,
  today: string = toDateKey(),
  limit = 6,
): Suggestion[] {
  const groups = new Map<string, { entries: FoodEntry[]; sameMeal: number }>();
  for (const entry of entries) {
    // Was heute schon drinsteht, muss nicht vorgeschlagen werden.
    if (entry.date === today) continue;
    // Übernommene Tagessummen sind keine wiederholbaren Lebensmittel.
    if (entry.source === "import") continue;
    const key = fingerprint(entry);
    const group = groups.get(key) ?? { entries: [], sameMeal: 0 };
    group.entries.push(entry);
    if (entry.meal === meal) group.sameMeal++;
    groups.set(key, group);
  }

  const scored: { score: number; suggestion: Suggestion }[] = [];
  for (const group of groups.values()) {
    const latest = [...group.entries].sort((a, b) =>
      b.date.localeCompare(a.date),
    )[0];
    if (!latest) continue;
    const ageDays = daysBetween(latest.date, today);
    const score =
      group.entries.length * 1.0 +
      group.sameMeal * 1.5 +
      Math.max(0, 14 - ageDays) * 0.2;

    const suggestion: Suggestion = {
      name: latest.name,
      kcalPer100g: latest.kcalPer100g,
      proteinPer100g: latest.proteinPer100g,
      carbsPer100g: latest.carbsPer100g,
      fatPer100g: latest.fatPer100g,
      suggestedGrams: latest.grams,
      source: latest.source,
      count: group.entries.length,
      lastUsed: latest.date,
    };
    if (latest.brand) suggestion.brand = latest.brand;
    if (latest.barcode) suggestion.barcode = latest.barcode;
    scored.push({ score, suggestion });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.suggestion);
}

/** Vorschläge aus der eigenen Historie — keine Favoritenliste, die
 *  gepflegt werden muss, sondern abgeleitet aus dem, was gegessen wird. */
export async function getSuggestions(
  meal: Meal,
  limit = 8,
  database: AppDatabase = db,
): Promise<Suggestion[]> {
  const today = toDateKey();
  const since = shiftDays(today, -LOOKBACK_DAYS);
  const entries = await database.entries
    .where("date")
    .aboveOrEqual(since)
    .toArray();
  return rankSuggestions(entries, meal, today, limit);
}
