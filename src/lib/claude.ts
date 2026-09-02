import type { NutritionCandidate } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

const PROMPT = `Du bist eine Ernährungs-Expertin. Analysiere das Foto einer Mahlzeit.
Schätze für jede erkennbare Komponente (z.B. Nudeln, Soße, Fleisch, Gemüse, Beilage, Öl beim Anbraten falls plausibel) das Gewicht in Gramm sowie die Nährwerte pro 100 g.

Antworte AUSSCHLIESSLICH mit validem JSON, keine Erklärung, kein Markdown, kein Codeblock. Exaktes Format:
{"items":[{"name":"string","grams":number,"kcal_per_100g":number,"protein_per_100g":number,"carbs_per_100g":number,"fat_per_100g":number,"confidence":"hoch"|"mittel"|"niedrig"}],"notes":"string"}

Gramm sind ganze Zahlen. Die Nährwerte sind realistische Werte pro 100 g (z.B. gekochte Nudeln: 158 kcal, 5,8 g Protein, 31 g Kohlenhydrate, 0,9 g Fett). "notes" ist ein kurzer Satz zu Annahmen, oder ein leerer String. Wenn kein Essen erkennbar ist, gib ein leeres items-Array zurück und erkläre das kurz in notes.`;

interface AnalysisItem {
  name: string;
  grams: number;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  confidence: "hoch" | "mittel" | "niedrig";
}

export interface PhotoAnalysis {
  candidates: NutritionCandidate[];
  notes: string;
}

/** Verkleinert ein Foto auf Kantenlänge maxDim und liefert base64-JPEG.
 *  Spart Tokens (und damit Geld) bei jedem Vision-Aufruf. */
export function downscaleToBase64(
  file: File,
  maxDim: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Foto konnte nicht gelesen werden."));

    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas nicht verfügbar."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
    };
    img.onerror = () => reject(new Error("Foto konnte nicht geladen werden."));

    reader.readAsDataURL(file);
  });
}

export async function analyzePhoto(
  base64Image: string,
  apiKey: string,
): Promise<PhotoAnalysis> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API-Fehler (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: { text?: string }[];
  };
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Keine Antwort vom Modell erhalten.");

  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  let parsed: { items?: AnalysisItem[]; notes?: string };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Antwort des Modells war kein gültiges JSON.");
  }

  return {
    notes: parsed.notes ?? "",
    candidates: (parsed.items ?? []).map((item) => ({
      name: item.name,
      kcalPer100g: item.kcal_per_100g,
      proteinPer100g: item.protein_per_100g,
      carbsPer100g: item.carbs_per_100g,
      fatPer100g: item.fat_per_100g,
      suggestedGrams: item.grams,
      source: "photo" as const,
      confidence: item.confidence,
    })),
  };
}
