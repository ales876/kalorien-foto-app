import { shiftDays, toDateKey } from "./date";
import { db, type AppDatabase } from "./db";
import { normalize } from "./localFoods";
import type { FoodEntry, NutritionCandidate } from "./types";

/** Wie weit die eigene Historie durchsucht wird. */
export const HISTORY_DAYS = 365;

export interface HistoryHit extends NutritionCandidate {
  lastUsed: string;
  count: number;
}

function fingerprint(entry: FoodEntry): string {
  return `${normalize(entry.name)}|${normalize(entry.brand ?? "")}|${entry.kcalPer100g}`;
}

/** Durchsucht die eigenen Einträge — reine Funktion, testbar. Gleiche
 *  Lebensmittel werden zusammengefasst, der jüngste Eintrag liefert die
 *  Werte und die zuletzt genutzte Menge. Rang: Namensanfang vor
 *  enthalten vor Marke, dann Aktualität. */
export function searchHistoryEntries(
  entries: readonly FoodEntry[],
  query: string,
  limit = 8,
): HistoryHit[] {
  const needle = normalize(query.trim());
  if (needle.length < 2) return [];

  const groups = new Map<
    string,
    { latest: FoodEntry; count: number; rank: number }
  >();
  for (const entry of entries) {
    if (entry.source === "import") continue;
    const name = normalize(entry.name);
    const brand = normalize(entry.brand ?? "");
    let rank: number;
    if (name.startsWith(needle)) rank = 0;
    else if (name.includes(needle)) rank = 1;
    else if (brand.includes(needle)) rank = 2;
    else continue;

    const key = fingerprint(entry);
    const group = groups.get(key);
    if (!group) groups.set(key, { latest: entry, count: 1, rank });
    else {
      group.count++;
      if (entry.date > group.latest.date) group.latest = entry;
    }
  }

  return [...groups.values()]
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        b.latest.date.localeCompare(a.latest.date) ||
        b.count - a.count,
    )
    .slice(0, limit)
    .map(({ latest, count }) => {
      const hit: HistoryHit = {
        name: latest.name,
        kcalPer100g: latest.kcalPer100g,
        proteinPer100g: latest.proteinPer100g,
        carbsPer100g: latest.carbsPer100g,
        fatPer100g: latest.fatPer100g,
        suggestedGrams: latest.grams,
        source: latest.source,
        lastUsed: latest.date,
        count,
      };
      if (latest.brand) hit.brand = latest.brand;
      if (latest.barcode) hit.barcode = latest.barcode;
      return hit;
    });
}

export async function searchHistory(
  query: string,
  limit = 8,
  database: AppDatabase = db,
): Promise<HistoryHit[]> {
  const since = shiftDays(toDateKey(), -HISTORY_DAYS);
  const entries = await database.entries
    .where("date")
    .aboveOrEqual(since)
    .toArray();
  return searchHistoryEntries(entries, query, limit);
}
