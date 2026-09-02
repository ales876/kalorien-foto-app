import type { NutritionCandidate } from "./types";

/** Kompakter Eintrag im mitgelieferten Produktindex (public/de-foods.json).
 *  Kurze Schlüssel, weil die Datei 50.000 Produkte enthält. */
export interface IndexEntry {
  c: string; // Barcode
  n: string; // Name
  b: string; // Marke
  k: number; // kcal / 100 g
  p: number; // Proteine
  ch: number; // Kohlenhydrate
  f: number; // Fett
}

let cache: IndexEntry[] | null = null;
let loading: Promise<IndexEntry[]> | null = null;

/** Lädt den Index einmalig und hält ihn im Speicher. Der Service Worker
 *  cached die Datei — ab dem zweiten Start ist sie offline da. */
export function loadIndex(
  fetchFn: typeof fetch = fetch,
): Promise<IndexEntry[]> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetchFn(`${import.meta.env.BASE_URL}de-foods.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Index nicht ladbar (${res.status})`);
        return res.json() as Promise<IndexEntry[]>;
      })
      .then((data) => {
        cache = data;
        return data;
      })
      .catch((err: unknown) => {
        loading = null; // nächster Versuch darf es erneut probieren
        throw err;
      });
  }
  return loading;
}

/** Nur für Tests: Index direkt setzen statt laden. */
export function primeIndex(entries: IndexEntry[] | null): void {
  cache = entries;
  loading = null;
}

/** Umlaute und Akzente vereinheitlichen, damit „Müsli" auch „Muesli" findet. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toCandidate(
  entry: IndexEntry,
  source: "search" | "barcode" = "search",
): NutritionCandidate {
  const candidate: NutritionCandidate = {
    name: entry.n,
    kcalPer100g: entry.k,
    proteinPer100g: entry.p,
    carbsPer100g: entry.ch,
    fatPer100g: entry.f,
    suggestedGrams: 100,
    barcode: entry.c,
    source,
  };
  if (entry.b) candidate.brand = entry.b;
  return candidate;
}

/** Rang: exakter Name < Namensanfang < Wortanfang < enthalten < Marke. */
function rank(entry: IndexEntry, needle: string, wordStart: RegExp): number {
  const name = normalize(entry.n);
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (wordStart.test(name)) return 2;
  if (name.includes(needle)) return 3;
  if (normalize(entry.b).includes(needle)) return 4;
  return Number.POSITIVE_INFINITY;
}

export function searchIndex(
  index: readonly IndexEntry[],
  query: string,
  limit = 30,
): NutritionCandidate[] {
  const needle = normalize(query.trim());
  if (needle.length < 2) return [];
  const wordStart = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}`);

  const scored: { entry: IndexEntry; rank: number }[] = [];
  for (const entry of index) {
    const r = rank(entry, needle, wordStart);
    if (r !== Number.POSITIVE_INFINITY) scored.push({ entry, rank: r });
  }
  // Der Index ist nach Beliebtheit sortiert; bei gleichem Rang bleibt
  // die Reihenfolge erhalten, weil sort() stabil ist.
  scored.sort((a, b) => a.rank - b.rank);
  return scored.slice(0, limit).map((item) => toCandidate(item.entry));
}

export async function searchLocal(
  query: string,
  limit = 30,
): Promise<NutritionCandidate[]> {
  return searchIndex(await loadIndex(), query, limit);
}

/** Barcode-Treffer aus dem lokalen Index — spart den Netzaufruf komplett. */
export async function findByBarcode(
  barcode: string,
): Promise<NutritionCandidate | null> {
  const hit = (await loadIndex()).find((entry) => entry.c === barcode);
  return hit ? toCandidate(hit, "barcode") : null;
}
