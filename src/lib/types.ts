export type Meal = "fruehstueck" | "mittag" | "abend" | "snack";

export const MEALS: { id: Meal; label: string; icon: string }[] = [
  { id: "fruehstueck", label: "Frühstück", icon: "🌅" },
  { id: "mittag", label: "Mittag", icon: "☀️" },
  { id: "abend", label: "Abend", icon: "🌙" },
  { id: "snack", label: "Snack", icon: "🍎" },
];

export type EntrySource = "photo" | "barcode" | "search" | "manual";

/** Ein Eintrag im Ernährungstagebuch. Nährwerte immer pro 100 g gespeichert,
 *  damit eine spätere Gramm-Korrektur alles automatisch neu berechnet. */
export interface FoodEntry {
  id?: number;
  /** Lokales Datum als YYYY-MM-DD — Basis für alle Tagesauswertungen. */
  date: string;
  timestamp: number;
  meal: Meal;
  name: string;
  brand?: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: EntrySource;
  barcode?: string;
  /** Nur bei Foto-Einträgen: kleines Vorschaubild (base64, ohne Präfix). */
  thumb?: string;
}

export interface BodyMeasurement {
  id?: number;
  date: string;
  timestamp: number;
  weightKg?: number;
  waistCm?: number;
}

export interface Settings {
  id: string;
  apiKey: string;
  kcalGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  apiKey: "",
  kcalGoal: 2000,
  proteinGoal: 130,
  carbsGoal: 200,
  fatGoal: 70,
};

/** Was Suche, Barcode-Scan und Foto-Analyse einheitlich zurückgeben. */
export interface NutritionCandidate {
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  /** Vorschlag für die Portionsgröße in Gramm. */
  suggestedGrams: number;
  barcode?: string;
  source: EntrySource;
  thumb?: string;
  /** Nur Foto-Analyse: wie sicher das Modell die Zutat erkannt hat. */
  confidence?: "hoch" | "mittel" | "niedrig";
}
