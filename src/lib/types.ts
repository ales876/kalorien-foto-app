export type Meal = "fruehstueck" | "mittag" | "abend" | "snack";

/** Farben je Mahlzeit — wie bei Things bekommt jeder Bereich seinen
 *  eigenen Akzent, damit man ihn im Vorbeiscrollen wiedererkennt. */
export const MEALS: { id: Meal; label: string; color: string }[] = [
  { id: "fruehstueck", label: "Frühstück", color: "var(--meal-morning)" },
  { id: "mittag", label: "Mittag", color: "var(--meal-noon)" },
  { id: "abend", label: "Abend", color: "var(--meal-evening)" },
  { id: "snack", label: "Snack", color: "var(--meal-snack)" },
];

export type EntrySource =
  | "photo"
  | "barcode"
  | "search"
  | "manual"
  /** Aus einer anderen App übernommene Tagessumme — kein einzelnes
   *  Lebensmittel und deshalb nicht als Vorschlag brauchbar. */
  | "import";

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

/** Die Mifflin-St-Jeor-Formel kennt nur zwei Varianten. Das ist eine
 *  Eigenschaft der Formel, keine Aussage über Menschen. */
export type FormulaSex = "m" | "w";

/** Verbrauch durch Bewegung, aus der Health-App übertragen.
 *  Bewusst getrennt von der Energiebilanz: der gemessene
 *  Erhaltungsbedarf enthält die Bewegung bereits, eine Verrechnung
 *  würde sie doppelt zählen. */
export interface Activity {
  id?: number;
  date: string;
  timestamp: number;
  kcal: number;
  note?: string;
}

export interface Settings {
  id: string;
  apiKey: string;
  palette: string;
  heightCm?: number;
  birthYear?: number;
  sex?: FormulaSex;
  kcalGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  apiKey: "",
  palette: "gelb",
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
