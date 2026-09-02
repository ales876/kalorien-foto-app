import { describe, expect, it } from "vitest";
import {
  formatDecimal,
  formatNumber,
  formatSigned,
  parseNonNegative,
  parsePositive,
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
