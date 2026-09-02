/** Akzentfarben zur Auswahl. Der Rest der Oberfläche bleibt unberührt —
 *  heller Untergrund, weiße Karten, Haarlinien. Nur der Akzent wechselt.
 *
 *  Die Schriftfarbe auf dem Akzent ist je Palette festgelegt und auf
 *  mindestens 4,5:1 Kontrast geprüft (WCAG AA für Fließtext). */
export interface Palette {
  id: string;
  label: string;
  hint: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  onAccent: string;
  /** Gegenfarbe auf dem Farbkreis — trägt die Auswahl in der
   *  Wochenleiste, damit sie sich vom Fortschrittsring absetzt. */
  complement: string;
  complementSoft: string;
}

export const PALETTES: Palette[] = [
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
    hint: "Ruhig, passt zum Thema Ernährung",
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

export const DEFAULT_PALETTE = PALETTES[0];

export function getPalette(id: string | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? DEFAULT_PALETTE;
}

/** Schreibt die Palette als CSS-Variablen auf das Wurzelelement. */
export function applyPalette(id: string | undefined): Palette {
  const palette = getPalette(id);
  const root = document.documentElement.style;
  root.setProperty("--accent", palette.accent);
  root.setProperty("--accent-soft", palette.accentSoft);
  root.setProperty("--accent-deep", palette.accentDeep);
  root.setProperty("--on-accent", palette.onAccent);
  root.setProperty("--complement", palette.complement);
  root.setProperty("--complement-soft", palette.complementSoft);
  return palette;
}
