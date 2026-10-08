import { describe, expect, it } from "vitest";

import { BASE_RATES } from "./data/starforce-rules.ts";
import { DEFAULT_STARFORCE_OPTIONS, PPM, chances, formatChance, maxStar, type StarforceOptions } from "./starforce.ts";

const opts = (patch: Partial<StarforceOptions> = {}): StarforceOptions => ({ ...DEFAULT_STARFORCE_OPTIONS, ...patch });

describe("maxStar", () => {
  it.each([
    [94, 5],
    [95, 8],
    [117, 10],
    [118, 15],
    [137, 20],
    [138, 30],
    [250, 30],
  ])("level %i caps at %i", (level, cap) => {
    expect(maxStar(level)).toBe(cap);
  });
});

describe("chances", () => {
  it("matches the official star catch rows", () => {
    expect(chances(0, opts(), false)).toEqual({ success: 997_500, fail: 2_500, destroy: 0 });
    expect(chances(14, opts(), false)).toEqual({ success: 315_000, fail: 685_000, destroy: 0 });
    expect(chances(15, opts(), false)).toEqual({ success: 315_000, fail: 664_450, destroy: 20_550 });
    expect(chances(21, opts(), false)).toEqual({ success: 157_500, fail: 716_125, destroy: 126_375 });
    expect(chances(29, opts(), false)).toEqual({ success: 10_500, fail: 791_600, destroy: 197_900 });
  });

  it("sums to one million on every star and option mix", () => {
    const mixes = [opts(), opts({ destroyReduction: true }), opts({ guarantee51015: true, destroyReduction: true })];
    for (const o of mixes) {
      for (let star = 0; star < BASE_RATES.length; star++) {
        for (const protect of [false, true]) {
          const c = chances(star, o, protect);
          expect(c.success + c.fail + c.destroy).toBe(PPM);
        }
      }
    }
  });

  it("cuts destroy by 30% up to 21 stars only", () => {
    expect(chances(21, opts({ destroyReduction: true }), false).destroy).toBe(88_463);
    expect(chances(22, opts({ destroyReduction: true }), false).destroy).toBe(168_500);
  });

  it("zeroes destroy under protection on 15~17 only", () => {
    expect(chances(17, opts(), true).destroy).toBe(0);
    expect(chances(18, opts(), true).destroy).toBe(67_400);
  });

  it("guarantees 5, 10 and 15 stars", () => {
    expect(chances(15, opts({ guarantee51015: true }), false)).toEqual({ success: PPM, fail: 0, destroy: 0 });
    expect(chances(16, opts({ guarantee51015: true }), false).success).toBe(315_000);
  });
});

describe("formatChance", () => {
  it("prints two decimals like the game", () => {
    expect(formatChance(997_500)).toBe("99.75%");
    expect(formatChance(20_550)).toBe("2.06%");
  });
});
