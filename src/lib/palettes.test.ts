import { describe, expect, it } from "vitest";
import { contrastRatio } from "./color";
import { PALETTES, applyPalette, getPalette } from "./palettes";

const AA = 4.5;

describe("Paletten", () => {
  it.each(PALETTES.map((p) => [p.label, p] as const))(
    "%s erreicht WCAG AA",
    (_label, palette) => {
      expect(
        contrastRatio(palette.accent, palette.onAccent),
      ).toBeGreaterThanOrEqual(AA);
      expect(
        contrastRatio(palette.complement, palette.complementSoft),
      ).toBeGreaterThanOrEqual(AA);
      // Die Gegenfarbe trägt Text auf weißen Karten („übernehmen").
      expect(
        contrastRatio(palette.complement, "#ffffff"),
      ).toBeGreaterThanOrEqual(AA);
    },
  );

  it("fällt bei unbekannter ID auf Gelb zurück", () => {
    expect(getPalette("neon").id).toBe("gelb");
    expect(getPalette("gelb").accent).toBe("#ffe680");
    expect(getPalette(undefined).id).toBe("gelb");
  });

  it("schreibt CSS-Variablen", () => {
    const root = document.createElement("div");
    applyPalette("tinte", root);
    expect(root.style.getPropertyValue("--accent")).toBe("#3570c6");
    expect(root.style.getPropertyValue("--on-accent")).toBe("#ffffff");
  });
});
