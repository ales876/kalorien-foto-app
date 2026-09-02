import type { NutritionCandidate } from "./types";

/** Open Food Facts bittet um eine Client-Kennung. Der User-Agent-Header
 *  ist im Browser verboten (löst einen CORS-Preflight aus), deshalb geht
 *  die Kennung als Query-Parameter mit. */
const APP_ID = "Plate";

/** Der Produktendpunkt ist CORS-fähig und stabil. */
const PRODUCT_API = "https://world.openfoodfacts.org/api/v2/product";
/** Volltextsuche gibt es browserseitig nur über diesen offiziell
 *  veralteten Endpunkt — die moderne Such-API (search.openfoodfacts.org)
 *  sendet keine CORS-Header. Unter Last antwortet er mit 503; deshalb
 *  ist er nur der Fallback hinter dem lokalen Index. */
const SEARCH_API = "https://world.openfoodfacts.org/cgi/search.pl";

const FIELDS = [
  "code",
  "product_name",
  "product_name_de",
  "brands",
  "nutriments",
].join(",");

interface OffNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_de?: string;
  brands?: string;
  nutriments?: OffNutriments;
}

export class ProductNotFoundError extends Error {
  constructor(barcode: string) {
    super(`Kein Produkt mit Barcode ${barcode} gefunden.`);
  }
}

export class MissingNutrimentsError extends Error {
  constructor(productName: string) {
    super(`Für „${productName}" sind keine Nährwerte hinterlegt.`);
  }
}

export class SearchUnavailableError extends Error {
  constructor() {
    super(
      "Die Live-Suche von Open Food Facts ist gerade überlastet. Barcode-Scan funktioniert weiterhin.",
    );
  }
}

function displayName(product: OffProduct): string {
  return (
    product.product_name_de?.trim() ||
    product.product_name?.trim() ||
    "Unbenanntes Produkt"
  );
}

/** Erste Marke reicht — OFF listet teils ein halbes Dutzend. */
function firstBrand(product: OffProduct): string | undefined {
  return product.brands?.split(",")[0]?.trim() || undefined;
}

function hasNutriments(product: OffProduct): boolean {
  return typeof product.nutriments?.["energy-kcal_100g"] === "number";
}

export function toCandidate(
  product: OffProduct,
  source: "barcode" | "search",
): NutritionCandidate {
  const n = product.nutriments ?? {};
  const candidate: NutritionCandidate = {
    name: displayName(product),
    kcalPer100g: n["energy-kcal_100g"] ?? 0,
    proteinPer100g: n.proteins_100g ?? 0,
    carbsPer100g: n.carbohydrates_100g ?? 0,
    fatPer100g: n.fat_100g ?? 0,
    suggestedGrams: 100,
    source,
  };
  const brand = firstBrand(product);
  if (brand) candidate.brand = brand;
  if (product.code) candidate.barcode = product.code;
  return candidate;
}

/** Der Legacy-Endpunkt sortiert nach Beliebtheit, nicht nach Treffergüte. */
export function sortByRelevance(
  candidates: NutritionCandidate[],
  query: string,
): NutritionCandidate[] {
  const needle = query.trim().toLowerCase();
  const score = (candidate: NutritionCandidate): number => {
    const name = candidate.name.toLowerCase();
    const brand = candidate.brand?.toLowerCase() ?? "";
    if (name === needle) return 0;
    if (name.startsWith(needle)) return 1;
    if (name.includes(needle)) return 2;
    if (brand.includes(needle)) return 3;
    if (candidate.name === "Unbenanntes Produkt") return 5;
    return 4;
  };
  return [...candidates].sort((a, b) => score(a) - score(b));
}

export async function lookupBarcode(
  barcode: string,
  fetchFn: typeof fetch = fetch,
): Promise<NutritionCandidate> {
  const params = new URLSearchParams({ fields: FIELDS, app_name: APP_ID });
  const res = await fetchFn(
    `${PRODUCT_API}/${encodeURIComponent(barcode)}.json?${params}`,
  );
  if (res.status === 404) throw new ProductNotFoundError(barcode);
  if (!res.ok)
    throw new Error(`Open Food Facts antwortete mit Status ${res.status}.`);

  const data = (await res.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product)
    throw new ProductNotFoundError(barcode);
  if (!hasNutriments(data.product))
    throw new MissingNutrimentsError(displayName(data.product));
  return toCandidate(data.product, "barcode");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Volltextsuche mit Wiederholversuchen — der Endpunkt antwortet unter
 *  Last regelmäßig mit 503, ist beim nächsten Versuch aber meist da. */
export async function searchProducts(
  query: string,
  {
    limit = 20,
    attempts = 3,
    fetchFn = fetch,
  }: { limit?: number; attempts?: number; fetchFn?: typeof fetch } = {},
): Promise<NutritionCandidate[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(limit),
    fields: FIELDS,
    app_name: APP_ID,
  });

  let lastStatus = 0;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(600 * attempt);
    let res: Response;
    try {
      res = await fetchFn(`${SEARCH_API}?${params}`);
    } catch {
      continue;
    }
    if (res.ok) {
      const data = (await res.json()) as { products?: OffProduct[] };
      const candidates = (data.products ?? [])
        .filter(hasNutriments)
        .map((product) => toCandidate(product, "search"));
      return sortByRelevance(candidates, query);
    }
    lastStatus = res.status;
  }

  if (lastStatus === 503 || lastStatus === 0)
    throw new SearchUnavailableError();
  throw new Error(`Suche fehlgeschlagen (Status ${lastStatus}).`);
}
