import { describe, expect, it } from "vitest";

import { BASE_RATES } from "./data/starforce-rules.ts";
import {
  DEFAULT_STARFORCE_OPTIONS,
  PPM,
  attemptCost,
  baseCost,
  chances,
  formatChance,
  maxStar,
  restoreCost,
  type StarforceOptions,
} from "./starforce.ts";

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

describe("baseCost", () => {
  it("matches the official screenshots", () => {
    expect(baseCost(140, 0)).toBe(77_200);
    expect(baseCost(200, 0)).toBe(223_200);
  });

  it("uses the 2.7 exponent from 10 stars", () => {
    expect(baseCost(200, 15)).toBe(71_316_500);
    expect(baseCost(250, 29)).toBe(760_357_800);
  });
});

describe("attemptCost", () => {
  it("takes 5% off for the PC room without rounding to 100", () => {
    expect(attemptCost(140, 0, opts({ pcRoom: true }), false).total).toBe(73_340);
    expect(attemptCost(200, 0, opts({ pcRoom: true }), false).total).toBe(212_040);
  });

  it("adds MVP and PC room, then multiplies the 30% event", () => {
    const c = attemptCost(200, 0, opts({ mvp: "black", pcRoom: true, discount30: true }), false);
    expect(c.discounted).toBe(Math.floor((223_200 * 85 * 70) / 10_000));
  });

  it("stops member discounts after 16 stars", () => {
    expect(attemptCost(200, 16, opts({ mvp: "diamond" }), false).total).toBe(Math.floor(baseCost(200, 16) * 0.9));
    expect(attemptCost(200, 17, opts({ mvp: "diamond" }), false).total).toBe(baseCost(200, 17));
  });

  it("charges protection at twice the undiscounted base", () => {
    const c = attemptCost(200, 17, opts({ discount30: true }), true);
    expect(c.protection).toBe(baseCost(200, 17) * 2);
    expect(c.total).toBe(c.discounted + c.protection);
    expect(c.before).toBe(c.base + c.protection);
  });

  it("does not charge protection on a guaranteed 15", () => {
    expect(attemptCost(200, 15, opts({ guarantee51015: true }), true).protection).toBe(0);
  });
});

describe("restoreCost", () => {
  it("uses the listed table when the level is listed", () => {
    expect(restoreCost(200, 18, opts())).toEqual({ meso: 4_010_000_000, spares: 1, estimated: false });
    expect(restoreCost(250, 22, opts())).toEqual({ meso: 47_300_000_000, spares: 4, estimated: false });
  });

  it("scales by L³ for unlisted levels", () => {
    expect(restoreCost(145, 15, opts())).toEqual({ meso: 165_000_000, spares: 1, estimated: true });
  });

  it("discounts meso only", () => {
    expect(restoreCost(200, 21, opts({ restoreDiscount: true }))).toEqual({
      meso: 11_840_000_000,
      spares: 3,
      estimated: false,
    });
  });
});
