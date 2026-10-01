/** Ganze Zahl in deutscher Schreibweise: 1234 → „1.234". */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("de-DE");
}

/** Dezimalzahl mit Komma: 84.5 → „84,5". */
export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Vorzeichen immer sichtbar, echtes Minus statt Bindestrich: −1,5 / +0,3 */
export function formatSigned(value: number, digits = 1): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${formatDecimal(Math.abs(value), digits)}`;
}

/** Zahl für ein Eingabefeld: deutsches Komma, keine Tausenderpunkte. */
export function toInputValue(value: number): string {
  return String(value).replace(".", ",");
}

/** Lässt in einem Eingabefeld nur durch, was eine Zahl werden kann:
 *  Ziffern und höchstens ein Trennzeichen. Das Komma bleibt stehen —
 *  die deutsche iOS-Tastatur tippt eines, und ein `type="number"` würde
 *  die ganze Eingabe deshalb verwerfen. */
export function sanitizeNumberInput(raw: string, allowDecimals = true): string {
  const digitsOnly = raw.replace(/[^\d.,]/g, "");
  if (!allowDecimals) return digitsOnly.replace(/[.,]/g, "");

  // Nur das erste Trennzeichen behalten.
  const match = /^(\d*)([.,])?(.*)$/.exec(digitsOnly);
  if (!match) return digitsOnly;
  const [, ganz, trenner, rest] = match;
  if (!trenner) return ganz ?? "";
  return `${ganz ?? ""}${trenner}${(rest ?? "").replace(/[.,]/g, "")}`;
}

/** Eingabe mit Komma oder Punkt in eine positive Zahl wandeln, sonst undefined. */
export function parsePositive(raw: string): number | undefined {
  const value = Number(raw.trim().replace(",", "."));
  return raw.trim() !== "" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

/** Wie parsePositive, aber 0 ist erlaubt. */
export function parseNonNegative(raw: string): number | undefined {
  const value = Number(raw.trim().replace(",", "."));
  return raw.trim() !== "" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}
