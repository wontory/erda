import { describe, expect, it } from "vitest";

import { BASE_RATES } from "./data/starforce-rules.ts";
import {
  DEFAULT_STARFORCE_OPTIONS,
  DEFAULT_STARFORCE_SETTINGS,
  EMPTY_LEDGER,
  PPM,
  attemptCost,
  baseCost,
  chances,
  enhance,
  formatChance,
  formatMeso,
  initialStarforceState,
  ledgerTotal,
  maxStar,
  restore,
  restoreCost,
  shouldStopAuto,
  starforceSettingsSchema,
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

describe("initialStarforceState", () => {
  it("clamps level and start star to the item cap", () => {
    expect(initialStarforceState(120, 25)).toMatchObject({ level: 120, star: 15, trace: null });
    expect(initialStarforceState(999, -3)).toMatchObject({ level: 250, star: 0 });
  });
});

describe("enhance", () => {
  const at = (star: number) => ({ ...initialStarforceState(200, 0), star });

  it("succeeds below the success band and charges the attempt", () => {
    const r = enhance(at(15), opts(), false, 0)!;
    expect(r).toMatchObject({ outcome: "success", from: 15, to: 16 });
    expect(r.state.ledger).toMatchObject({ attempts: 1, successes: 1, enhanceMeso: 71_316_500n });
  });

  it("keeps the star on a fail", () => {
    const r = enhance(at(15), opts(), false, 315_000)!;
    expect(r).toMatchObject({ outcome: "fail", to: 15 });
    expect(r.state.ledger.failures).toBe(1);
  });

  it("destroys in the top band and caps the trace at 22", () => {
    expect(enhance(at(15), opts(), false, PPM - 1)!.state).toMatchObject({ star: 15, trace: 15 });
    expect(enhance(at(25), opts(), false, PPM - 1)!.state).toMatchObject({ trace: 22 });
  });

  it("reports a destroy roll blocked by protection", () => {
    const r = enhance(at(16), opts(), true, PPM - 1)!;
    expect(r.outcome).toBe("protected");
    expect(r.state.trace).toBeNull();
    expect(r.state.ledger.enhanceMeso).toBe(BigInt(baseCost(200, 16) * 3));
  });

  it("jumps two stars with 1+1 up to 10 stars", () => {
    expect(enhance(at(10), opts({ plusOne: true }), false, 0)!.to).toBe(12);
    expect(enhance(at(11), opts({ plusOne: true }), false, 0)!.to).toBe(12);
  });

  it("refuses at the cap or while destroyed", () => {
    expect(enhance({ ...initialStarforceState(120, 15) }, opts(), false, 0)).toBeNull();
    expect(enhance({ ...at(15), trace: 15 }, opts(), false, 0)).toBeNull();
  });
});

describe("restore", () => {
  const destroyed = { ...initialStarforceState(200, 0), star: 21, trace: 21 };

  it("restores the trace star with spares and meso", () => {
    expect(restore(destroyed, "full", opts())).toMatchObject({
      star: 21,
      trace: null,
      ledger: { restoreMeso: 14_800_000_000n, spares: 3 },
    });
  });

  it("restores to 12 stars with one spare and no meso", () => {
    expect(restore(destroyed, "base", opts())).toMatchObject({
      star: 12,
      trace: null,
      ledger: { restoreMeso: 0n, spares: 1 },
    });
  });
});

describe("ledgerTotal", () => {
  it("re-prices every spare used at the current spare price", () => {
    const ledger = { ...EMPTY_LEDGER, enhanceMeso: 100n, restoreMeso: 20n, spares: 3 };
    expect(ledgerTotal(ledger, 0)).toBe(120n);
    expect(ledgerTotal(ledger, 1_000_000_000)).toBe(3_000_000_120n);
  });
});

describe("shouldStopAuto", () => {
  const s = initialStarforceState(200, 17);
  it("stops at or past the target, at the cap, or when destroyed", () => {
    expect(shouldStopAuto(s, 17)).toBe(true);
    expect(shouldStopAuto(s, 10)).toBe(true);
    expect(shouldStopAuto(s, 22)).toBe(false);
    expect(shouldStopAuto({ ...s, trace: 17 }, 22)).toBe(true);
    expect(shouldStopAuto(initialStarforceState(120, 15), 30)).toBe(true);
  });
});

describe("formatMeso", () => {
  it("formats in 조/억/만 with exact digits past 2^53", () => {
    expect(formatMeso(0n)).toBe("0");
    expect(formatMeso(73_340n)).toBe("7만 3340");
    expect(formatMeso(12_345_678_901_234_567n)).toBe("12345조 6789억 123만 4567");
  });
});

describe("starforceSettingsSchema", () => {
  it("accepts the defaults", () => {
    expect(starforceSettingsSchema.parse(DEFAULT_STARFORCE_SETTINGS)).toEqual(DEFAULT_STARFORCE_SETTINGS);
  });
});
