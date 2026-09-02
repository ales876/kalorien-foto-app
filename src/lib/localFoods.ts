import type { NutritionCandidate } from "./types";

/** Kompakter Eintrag im mitgelieferten Produktindex. Kurze Schlüssel,
 *  weil die Datei mehrere zehntausend Produkte enthält. */
interface IndexEntry {
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

/** Lädt den Index einmalig und hält ihn danach im Speicher.
 *  Der Service Worker cached die Datei, ab dem zweiten Start ist sie offline da. */
export function loadIndex(): Promise<IndexEntry[]> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch(`${import.meta.env.BASE_URL}de-foods.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Index nicht ladbar (${res.status})`);
        return res.json() as Promise<IndexEntry[]>;
      })
      .then((data) => {
        cache = data;
        return data;
      })
      .catch((err) => {
        loading = null; // nächster Versuch darf es erneut probieren
        throw err;
      });
  }
  return loading;
}

/** Umlaute und Akzente vereinheitlichen, damit „Müsli" auch „Muesli" findet. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function toCandidate(entry: IndexEntry): NutritionCandidate {
  return {
    name: entry.n,
    brand: entry.b || undefined,
    kcalPer100g: entry.k,
    proteinPer100g: entry.p,
    carbsPer100g: entry.ch,
    fatPer100g: entry.f,
    suggestedGrams: 100,
    barcode: entry.c,
    source: "search",
  };
}

/** Rang: exakter Name < Namensanfang < Wortanfang < enthalten < Marke. */
function score(entry: IndexEntry, needle: string): number {
  const name = normalize(entry.n);
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(name))
    return 2;
  if (name.includes(needle)) return 3;
  if (normalize(entry.b).includes(needle)) return 4;
  return Number.POSITIVE_INFINITY;
}

export async function searchLocal(
  query: string,
  limit = 30,
): Promise<NutritionCandidate[]> {
  const index = await loadIndex();
  const needle = normalize(query.trim());
  if (needle.length < 2) return [];

  const scored: { entry: IndexEntry; rank: number }[] = [];
  for (const entry of index) {
    const rank = score(entry, needle);
    if (rank !== Number.POSITIVE_INFINITY) scored.push({ entry, rank });
  }

  // Der Index ist nach Beliebtheit sortiert; bei gleichem Rang bleibt
  // diese Reihenfolge erhalten, weil sort() in JS stabil ist.
  scored.sort((a, b) => a.rank - b.rank);
  return scored.slice(0, limit).map((item) => toCandidate(item.entry));
}

/** Barcode-Treffer aus dem lokalen Index — spart den Netzaufruf komplett. */
export async function findByBarcode(
  barcode: string,
): Promise<NutritionCandidate | null> {
  const index = await loadIndex();
  const hit = index.find((entry) => entry.c === barcode);
  return hit ? { ...toCandidate(hit), source: "barcode" } : null;
}
