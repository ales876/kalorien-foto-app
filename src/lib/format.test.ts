import { describe, expect, it } from "vitest";
import {
  formatDecimal,
  formatNumber,
  formatSigned,
  parseNonNegative,
  parsePositive,
  sanitizeNumberInput,
  toInputValue,
} from "./format";

describe("Zahlenformat", () => {
  it("schreibt Tausender und Kommas deutsch", () => {
    expect(formatNumber(1074.4)).toBe("1.074");
    expect(formatDecimal(84.5)).toBe("84,5");
    expect(formatDecimal(84)).toBe("84");
    expect(formatSigned(-1.5)).toBe("−1,5");
    expect(formatSigned(0.3)).toBe("+0,3");
  });
});

describe("Eingaben", () => {
  it("akzeptiert Komma und Punkt", () => {
    expect(parsePositive("74,5")).toBe(74.5);
    expect(parsePositive("74.5")).toBe(74.5);
  });

  it("weist Leeres, Null und Unsinn zurück", () => {
    expect(parsePositive("")).toBeUndefined();
    expect(parsePositive("0")).toBeUndefined();
    expect(parsePositive("abc")).toBeUndefined();
    expect(parseNonNegative("0")).toBe(0);
    expect(parseNonNegative("-1")).toBeUndefined();
  });
});

describe("sanitizeNumberInput", () => {
  it("lässt Komma und Punkt als Trennzeichen zu", () => {
    expect(sanitizeNumberInput("74,5")).toBe("74,5");
    expect(sanitizeNumberInput("74.5")).toBe("74.5");
    expect(sanitizeNumberInput(",5")).toBe(",5");
  });

  it("wirft alles heraus, was keine Zahl sein kann", () => {
    expect(sanitizeNumberInput("74,5 kg")).toBe("74,5");
    expect(sanitizeNumberInput("abc")).toBe("");
    expect(sanitizeNumberInput("-74,5")).toBe("74,5");
  });

  it("behält nur das erste Trennzeichen", () => {
    expect(sanitizeNumberInput("74,5,2")).toBe("74,52");
    expect(sanitizeNumberInput("74.5,2")).toBe("74.52");
  });

  it("verbietet Trennzeichen bei ganzen Zahlen", () => {
    expect(sanitizeNumberInput("1650,5", false)).toBe("16505");
    expect(sanitizeNumberInput("624", false)).toBe("624");
  });
});

describe("toInputValue", () => {
  it("schreibt Dezimalzahlen mit Komma", () => {
    expect(toInputValue(74.5)).toBe("74,5");
    expect(toInputValue(100)).toBe("100");
  });
});
