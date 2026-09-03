export type Meal = "fruehstueck" | "mittag" | "abend" | "snack";

export interface MealInfo {
  id: Meal;
  label: string;
  /** CSS-Variable — jede Mahlzeit behält ihre Farbe, auch inaktiv. */
  color: string;
}

export const MEALS: readonly MealInfo[] = [
  { id: "fruehstueck", label: "Frühstück", color: "var(--meal-morning)" },
  { id: "mittag", label: "Mittag", color: "var(--meal-noon)" },
  { id: "abend", label: "Abend", color: "var(--meal-evening)" },
  { id: "snack", label: "Snack", color: "var(--meal-snack)" },
];

export const MEAL_IDS = MEALS.map((meal) => meal.id) as [Meal, ...Meal[]];

export function mealLabel(meal: Meal): string {
  return MEALS.find((m) => m.id === meal)?.label ?? meal;
}

export type EntrySource =
  | "photo"
  | "barcode"
  | "search"
  | "manual"
  /** Aus einer anderen App übernommene Tagessumme — kein einzelnes
   *  Lebensmittel und deshalb nicht als Vorschlag brauchbar. */
  | "import";

export const ENTRY_SOURCES: readonly EntrySource[] = [
  "photo",
  "barcode",
  "search",
  "manual",
  "import",
];

/** Ein Eintrag im Ernährungstagebuch.
 *
 *  Invariante: Nährwerte liegen IMMER pro 100 g, die Grammzahl ist der
 *  einzige veränderliche Mengenwert. Eine nachträgliche Korrektur der
 *  Menge rechnet Kalorien und Makros dadurch automatisch neu. */
export interface FoodEntry {
  id?: number;
  /** Lokales Datum als YYYY-MM-DD (nie toISOString — das wäre UTC). */
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
  /** Getränke werden in ml geführt; fehlt das Feld, gilt g. Die Nährwerte
   *  beziehen sich dann auf 100 ml — die Rechnung bleibt dieselbe. */
  unit?: Unit;
}

export type Unit = "g" | "ml";

/** Höchstens eine Messung pro Tag. */
export interface BodyMeasurement {
  id?: number;
  date: string;
  timestamp: number;
  weightKg?: number;
  waistCm?: number;
}

/** Aktive Energie aus der Health-App, höchstens ein Wert pro Tag.
 *  Bewusst NICHT gegen die Kalorien verrechnet: der gemessene
 *  Erhaltungsbedarf enthält die Bewegung bereits. */
export interface Activity {
  id?: number;
  date: string;
  timestamp: number;
  kcal: number;
  note?: string;
}

/** Die Mifflin-St-Jeor-Formel kennt nur zwei Varianten. Das ist eine
 *  Eigenschaft der Formel, keine Aussage über Menschen — in der
 *  Oberfläche heißt das Feld deshalb „Formel-Variante". */
export type FormulaSex = "m" | "w";

export type PaletteId = "gelb" | "salbei" | "terrakotta" | "tinte";

export interface Settings {
  id: "settings";
  /** Anthropic-Key, nur lokal in IndexedDB. */
  apiKey: string;
  palette: PaletteId;
  heightCm?: number;
  /** Alter in Jahren (ersetzt den früheren Jahrgang). */
  age?: number;
  /** Nur noch für alte Datenbestände; wird beim Laden in `age` überführt. */
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
  heightCm: 179,
  age: 40,
  sex: "m",
  kcalGoal: 1650,
  proteinGoal: 120,
  carbsGoal: 220,
  fatGoal: 25,
};

/** Ziele der ersten Version — wer sie nie angefasst hat, bekommt beim
 *  Laden die neuen Standardwerte. */
export const LEGACY_DEFAULT_GOALS = {
  kcalGoal: 2000,
  proteinGoal: 130,
  carbsGoal: 200,
  fatGoal: 70,
} as const;

export type Confidence = "hoch" | "mittel" | "niedrig";

/** Was Suche, Barcode-Scan, Foto-Analyse und Vorschläge einheitlich
 *  liefern — der ConfirmStep macht daraus einen FoodEntry. */
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
  unit?: Unit;
  /** Nur Foto-Analyse: wie sicher das Modell die Zutat erkannt hat. */
  confidence?: Confidence;
}
