/** Fremde Bibliotheken werfen nicht immer `Error` — html5-qrcode etwa
 *  wirft bloße Zeichenketten. Daraus einen lesbaren Text machen, statt
 *  „undefined: undefined" anzuzeigen. */
export function messageOf(
  error: unknown,
  fallback = "Unbekannter Fehler",
): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
