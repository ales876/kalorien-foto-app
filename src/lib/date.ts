const DAY_MS = 86_400_000;

/** Lokales Datum als YYYY-MM-DD.
 *  Bewusst nicht toISOString(): das rechnet in UTC um und verschiebt
 *  abends den Tag. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function isDateKey(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(fromDateKey(value).getTime())
  );
}

/** „2026-09-02" → „02.09.2026" */
export function formatDateKey(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

/** „2026-09-02" → „02.09." */
export function shortDate(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}.${m}.`;
}

export function longDate(key: string): string {
  return fromDateKey(key).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Uhrzeit eines Zeitstempels als „08:12". */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shiftDays(key: string, delta: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

/** Ganze Kalendertage zwischen zwei Schlüsseln (to − from). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (fromDateKey(to).getTime() - fromDateKey(from).getTime()) / DAY_MS,
  );
}

/** Alle Tagesschlüssel der letzten n Tage inklusive heute, ältester zuerst. */
export function lastNDays(n: number, today: string = toDateKey()): string[] {
  return Array.from({ length: n }, (_, i) => shiftDays(today, i - (n - 1)));
}

/** Die sieben Tage der Woche, in der `key` liegt — Montag zuerst. */
export function weekOf(key: string): string[] {
  const offsetToMonday = (fromDateKey(key).getDay() + 6) % 7;
  const monday = shiftDays(key, -offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => shiftDays(monday, i));
}

export const WEEKDAY_SHORT = [
  "Mo",
  "Di",
  "Mi",
  "Do",
  "Fr",
  "Sa",
  "So",
] as const;

export function weekdayShort(key: string): string {
  return WEEKDAY_SHORT[(fromDateKey(key).getDay() + 6) % 7] ?? "";
}
