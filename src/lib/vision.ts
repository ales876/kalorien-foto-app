import Anthropic, {
  APIConnectionError,
  APIError,
  AuthenticationError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { guessUnit } from "./nutrition";
import type { NutritionCandidate } from "./types";

/** Opus 5 ist der aktuelle Standard der Anthropic-API; ein Foto kostet
 *  damit rund einen Cent. Mittlere Denktiefe: schneller, für eine
 *  Portionsschätzung völlig ausreichend. */
export const VISION_MODEL = "claude-opus-5";

const PROMPT = `Analysiere das Foto einer Mahlzeit. Schätze für jede erkennbare Komponente (z. B. Nudeln, Soße, Fleisch, Gemüse, Beilage, Öl beim Anbraten falls plausibel) das Gewicht in Gramm sowie die Nährwerte pro 100 g.

Gramm sind ganze Zahlen. Die Nährwerte sind realistische Werte pro 100 g (z. B. gekochte Nudeln: 158 kcal, 5,8 g Protein, 31 g Kohlenhydrate, 0,9 g Fett). Namen auf Deutsch, kurz. "notes" ist ein kurzer Satz zu Annahmen oder ein leerer String. Wenn kein Essen erkennbar ist, gib ein leeres items-Array zurück und erkläre das kurz in notes.`;

const analysisSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      grams: z.number(),
      kcal_per_100g: z.number(),
      protein_per_100g: z.number(),
      carbs_per_100g: z.number(),
      fat_per_100g: z.number(),
      confidence: z.enum(["hoch", "mittel", "niedrig"]),
    }),
  ),
  notes: z.string(),
});

export interface PhotoAnalysis {
  candidates: NutritionCandidate[];
  notes: string;
}

export class VisionError extends Error {}

/** Verkleinert ein Foto und liefert base64-JPEG ohne Data-URL-Präfix.
 *  Spart Tokens bei jedem Aufruf; die Miniatur landet als Vorschaubild
 *  im Eintrag. */
export function downscaleToBase64(
  file: Blob,
  maxDim: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width >= height && width > maxDim) {
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
        reject(new VisionError("Canvas nicht verfügbar."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1] ?? "");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new VisionError("Foto konnte nicht gelesen werden."));
    };
    img.src = url;
  });
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export async function analyzePhoto(
  base64Jpeg: string,
  apiKey: string,
): Promise<PhotoAnalysis> {
  // Der Key liegt nur lokal auf dem Gerät und gehört dem Nutzer selbst —
  // deshalb ist der direkte Aufruf aus dem Browser hier in Ordnung.
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    maxRetries: 1,
  });

  try {
    const response = await client.messages.parse({
      model: VISION_MODEL,
      max_tokens: 4096,
      output_config: {
        format: zodOutputFormat(analysisSchema),
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Jpeg,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new VisionError(
        "Das Modell hat die Analyse dieses Fotos abgelehnt.",
      );
    }
    const parsed = response.parsed_output;
    if (!parsed)
      throw new VisionError("Die Antwort des Modells war nicht lesbar.");

    return {
      notes: parsed.notes.trim(),
      candidates: parsed.items.map((item) => ({
        name: item.name.trim() || "Unbekannt",
        kcalPer100g: clampNonNegative(item.kcal_per_100g),
        proteinPer100g: clampNonNegative(item.protein_per_100g),
        carbsPer100g: clampNonNegative(item.carbs_per_100g),
        fatPer100g: clampNonNegative(item.fat_per_100g),
        suggestedGrams: Math.max(1, Math.round(clampNonNegative(item.grams))),
        source: "photo",
        unit: guessUnit(item.name),
        confidence: item.confidence,
      })),
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw new VisionError(
        "Der API-Key wurde abgelehnt. Bitte in den Einstellungen prüfen.",
      );
    }
    if (error instanceof RateLimitError) {
      throw new VisionError(
        "Zu viele Anfragen — bitte kurz warten und noch einmal versuchen.",
      );
    }
    if (error instanceof APIConnectionError) {
      throw new VisionError("Keine Verbindung zur Anthropic-API.");
    }
    if (error instanceof APIError) {
      throw new VisionError(
        `API-Fehler (${error.status ?? "?"}): ${error.message}`,
      );
    }
    throw error;
  }
}
