import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatDateKey,
  lastNDays,
  shiftDays,
  shortDate,
  toDateKey,
  weekOf,
  weekdayShort,
} from "./date";

describe("toDateKey", () => {
  it("nutzt das lokale Datum, nicht UTC", () => {
    // 23:30 lokal darf nicht in den nächsten Tag kippen.
    expect(toDateKey(new Date(2026, 8, 2, 23, 30))).toBe("2026-09-02");
    expect(toDateKey(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });
});

describe("Formatierung", () => {
  it("formatiert deutsch", () => {
    expect(formatDateKey("2026-09-02")).toBe("02.09.2026");
    expect(shortDate("2026-09-02")).toBe("02.09.");
    expect(weekdayShort("2026-09-02")).toBe("Mi");
  });
});

describe("Rechnen mit Tagen", () => {
  it("verschiebt über Monatsgrenzen", () => {
    expect(shiftDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("zählt ganze Tage", () => {
    expect(daysBetween("2026-08-01", "2026-08-27")).toBe(26);
    expect(daysBetween("2026-09-02", "2026-09-02")).toBe(0);
  });

  it("liefert die Woche ab Montag", () => {
    expect(weekOf("2026-09-02")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
    expect(weekOf("2026-09-06")[0]).toBe("2026-08-31");
  });

  it("liefert die letzten n Tage, ältester zuerst", () => {
    expect(lastNDays(3, "2026-09-02")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });
});
