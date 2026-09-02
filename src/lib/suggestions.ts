import { db } from "./db";
import { toDateKey } from "./nutrition";
import type { FoodEntry, Meal, NutritionCandidate } from "./types";

/** Wie weit zurück Vorschläge gesucht werden. */
const LOOKBACK_DAYS = 60;

export interface Suggestion extends NutritionCandidate {
  /** Wie oft im Zeitraum erfasst. */
  count: number;
  lastUsed: string;
}

function fingerprint(entry: FoodEntry): string {
  return `${entry.name}|${entry.brand ?? ""}|${entry.kcalPer100g}`;
}

function dateKeyDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateKey(d);
}

/** Vorschläge aus der eigenen Historie — keine Liste, die gepflegt werden
 *  muss, sondern abgeleitet aus dem, was tatsächlich gegessen wird.
 *
 *  Gewichtet nach Häufigkeit, mit Zuschlag für dieselbe Mahlzeit und für
 *  kürzlich Gegessenes: was man morgens isst, isst man meist wieder
 *  morgens, und was letzte Woche dran war eher als was im Juli dran war. */
export async function getSuggestions(
  meal: Meal,
  limit = 6,
): Promise<Suggestion[]> {
  const since = dateKeyDaysAgo(LOOKBACK_DAYS);
  const today = toDateKey();
  const entries = await db.entries.where("date").aboveOrEqual(since).toArray();

  const groups = new Map<string, { entries: FoodEntry[]; sameMeal: number }>();
  for (const entry of entries) {
    // Was heute schon drin steht, muss nicht vorgeschlagen werden.
    if (entry.date === today) continue;
    // Übernommene Tagessummen sind keine wiederholbaren Lebensmittel.
    if (entry.source === "import") continue;
    const key = fingerprint(entry);
    const group = groups.get(key) ?? { entries: [], sameMeal: 0 };
    group.entries.push(entry);
    if (entry.meal === meal) group.sameMeal++;
    groups.set(key, group);
  }

  const scored = [...groups.values()].map((group) => {
    const sorted = [...group.entries].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    const latest = sorted[0];
    const ageDays = daysAgo(latest.date);

    // Häufigkeit trägt am meisten, danach die passende Tageszeit.
    const score =
      group.entries.length * 1.0 +
      group.sameMeal * 1.5 +
      Math.max(0, 14 - ageDays) * 0.2;

    return {
      score,
      suggestion: {
        name: latest.name,
        brand: latest.brand,
        kcalPer100g: latest.kcalPer100g,
        proteinPer100g: latest.proteinPer100g,
        carbsPer100g: latest.carbsPer100g,
        fatPer100g: latest.fatPer100g,
        suggestedGrams: latest.grams,
        barcode: latest.barcode,
        source: latest.source,
        count: group.entries.length,
        lastUsed: latest.date,
      } satisfies Suggestion,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.suggestion);
}

function daysAgo(date: string): number {
  const then = new Date(`${date}T00:00:00`).getTime();
  const now = new Date(`${toDateKey()}T00:00:00`).getTime();
  return Math.round((now - then) / 86_400_000);
}

function copyOf(entry: FoodEntry, targetDate: string): Omit<FoodEntry, "id"> {
  const { id: _drop, ...rest } = entry;
  return { ...rest, date: targetDate, timestamp: Date.now() };
}

/** Der jüngste Tag vor `before`, an dem diese Mahlzeit erfasst wurde. */
export async function findPreviousMeal(
  meal: Meal,
  before: string,
): Promise<{ date: string; entries: FoodEntry[] } | null> {
  const candidates = await db.entries
    .where("date")
    .below(before)
    .and((entry) => entry.meal === meal)
    .toArray();

  if (candidates.length === 0) return null;

  const latestDate = candidates
    .map((e) => e.date)
    .reduce((a, b) => (a > b ? a : b));

  return {
    date: latestDate,
    entries: candidates.filter((e) => e.date === latestDate),
  };
}

export async function copyMeal(
  from: string,
  meal: Meal,
  to: string,
): Promise<number> {
  const entries = await db.entries
    .where("date")
    .equals(from)
    .and((entry) => entry.meal === meal)
    .toArray();

  if (entries.length === 0) return 0;
  await db.entries.bulkAdd(entries.map((e) => copyOf(e, to)) as FoodEntry[]);
  return entries.length;
}

export async function copyDay(from: string, to: string): Promise<number> {
  const entries = await db.entries.where("date").equals(from).toArray();
  if (entries.length === 0) return 0;
  await db.entries.bulkAdd(entries.map((e) => copyOf(e, to)) as FoodEntry[]);
  return entries.length;
}
