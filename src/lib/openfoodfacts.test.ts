import { describe, expect, it, vi } from "vitest";
import {
  MissingNutrimentsError,
  ProductNotFoundError,
  lookupBarcode,
  searchProducts,
  sortByRelevance,
} from "./openfoodfacts";
import type { NutritionCandidate } from "./types";

function candidate(name: string, brand?: string): NutritionCandidate {
  const c: NutritionCandidate = {
    name,
    kcalPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    suggestedGrams: 100,
    source: "search",
  };
  if (brand) c.brand = brand;
  return c;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("sortByRelevance", () => {
  it("stellt Namenstreffer vor Markentreffer", () => {
    const sorted = sortByRelevance(
      [
        candidate("Fromage Blanc", "Skyr Co"),
        candidate("Skyr Natur"),
        candidate("Skyr"),
      ],
      "skyr",
    );
    expect(sorted.map((c) => c.name)).toEqual([
      "Skyr",
      "Skyr Natur",
      "Fromage Blanc",
    ]);
  });
});

describe("lookupBarcode", () => {
  it("wandelt ein Produkt in einen Kandidaten", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        status: 1,
        product: {
          code: "4000",
          product_name: "Skyr",
          product_name_de: "Skyr Natur",
          brands: "Arla, Arla Foods",
          nutriments: {
            "energy-kcal_100g": 63,
            proteins_100g: 11,
            carbohydrates_100g: 4,
            fat_100g: 0.2,
          },
        },
      }),
    );
    const result = await lookupBarcode("4000", fetchFn);
    expect(result).toMatchObject({
      name: "Skyr Natur",
      brand: "Arla",
      kcalPer100g: 63,
      barcode: "4000",
      source: "barcode",
    });
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain("app_name=SunnyOrbit");
  });

  it("meldet fehlende Produkte und fehlende Nährwerte", async () => {
    await expect(
      lookupBarcode("1", async () => jsonResponse({ status: 0 })),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
    await expect(
      lookupBarcode("1", async () =>
        jsonResponse({ status: 1, product: { product_name: "Ohne" } }),
      ),
    ).rejects.toBeInstanceOf(MissingNutrimentsError);
  });
});

describe("searchProducts", () => {
  it("versucht es bei 503 erneut", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(
        jsonResponse({
          products: [
            { product_name: "Skyr", nutriments: { "energy-kcal_100g": 63 } },
            { product_name: "Ohne" },
          ],
        }),
      );
    const results = await searchProducts("skyr", { fetchFn, attempts: 2 });
    expect(results.map((r) => r.name)).toEqual(["Skyr"]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
