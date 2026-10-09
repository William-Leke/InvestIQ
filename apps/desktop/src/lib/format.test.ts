import { describe, expect, it } from "vitest";
import { compact, compactMoney, percent, ratio } from "./format";

describe("format", () => {
  it("compacts large numbers with units and keeps the sign", () => {
    expect(compact(3.45e12)).toBe("3.45T");
    expect(compact(-12e9, 1)).toBe("-12.0B");
    expect(compact(950)).toBe("950.00");
    expect(compact(null)).toBe("—");
    expect(compactMoney(-12e9)).toBe("-$12.00B");
  });

  it("formats signed percentages", () => {
    expect(percent(1.234)).toBe("+1.23%");
    expect(percent(-0.5)).toBe("-0.50%");
  });

  it("computes margins and skips missing or zero denominators", () => {
    expect(ratio([50, null, 10], [200, 100, 0])).toEqual([25, null, null]);
  });
});
