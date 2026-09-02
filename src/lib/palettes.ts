import type { PaletteId } from "./types";

/** Vier wählbare Akzente. Der Rest der Oberfläche bleibt unberührt —
 *  heller Untergrund, weiße Karten, Haarlinien. Nur der Akzent wechselt.
 *
 *  Jede Palette hat eine Gegenfarbe, die in der Wochenleiste die Auswahl
 *  trägt, damit sie sich vom Fortschrittsring absetzt. Alle Kombinationen
 *  sind auf mindestens 4,5:1 Kontrast geprüft (siehe palettes.test.ts). */
export interface Palette {
  id: PaletteId;
  label: string;
  hint: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  /** Schriftfarbe auf dem Akzent. */
  onAccent: string;
  complement: string;
  complementSoft: string;
}

export const PALETTES: readonly Palette[] = [
  {
    id: "gelb",
    label: "Sonnengelb",
    hint: "Wach und freundlich",
    accent: "#ffd400",
    accentSoft: "#fff6cc",
    accentDeep: "#e6be00",
    onAccent: "#1c1c1e",
    complement: "#4759c9",
    complementSoft: "#e8eafb",
  },
  {
    id: "salbei",
    label: "Salbei",
    hint: "Ruhig, passt zum Thema",
    accent: "#7cbfa0",
    accentSoft: "#e6f3ec",
    accentDeep: "#5ea588",
    onAccent: "#14352a",
    complement: "#8f4a70",
    complementSoft: "#f7ebf1",
  },
  {
    id: "terrakotta",
    label: "Terrakotta",
    hint: "Warm und erdig",
    accent: "#e2795b",
    accentSoft: "#fbe9e3",
    accentDeep: "#c9634a",
    onAccent: "#3a1d14",
    complement: "#256d82",
    complementSoft: "#e4f2f6",
  },
  {
    id: "tinte",
    label: "Tinte",
    hint: "Nüchtern, nah an Things",
    accent: "#3570c6",
    accentSoft: "#e3edfb",
    accentDeep: "#2c5fac",
    onAccent: "#ffffff",
    complement: "#8a5a1c",
    complementSoft: "#f8eede",
  },
];

export const DEFAULT_PALETTE: Palette = PALETTES[0] as Palette;

export function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((p) => p.id === value);
}

export function getPalette(id: string | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? DEFAULT_PALETTE;
}

/** Schreibt die Palette als CSS-Variablen auf das Wurzelelement. */
export function applyPalette(
  id: string | undefined,
  root: HTMLElement = document.documentElement,
): Palette {
  const palette = getPalette(id);
  const style = root.style;
  style.setProperty("--accent", palette.accent);
  style.setProperty("--accent-soft", palette.accentSoft);
  style.setProperty("--accent-deep", palette.accentDeep);
  style.setProperty("--on-accent", palette.onAccent);
  style.setProperty("--complement", palette.complement);
  style.setProperty("--complement-soft", palette.complementSoft);
  return palette;
}
