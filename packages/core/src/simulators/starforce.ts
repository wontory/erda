import { z } from "zod";

import { MAX_MESO } from "#/calculators/boss-split.ts";
import {
  BASE_RATES,
  BASE_RESTORE_STAR,
  COST_DIVISORS,
  DESTROY_REDUCTION_MAX_STAR,
  GUARANTEE_STARS,
  LEVEL_STAR_CAPS,
  MAX_TRACE_STAR,
  MEMBER_DISCOUNT_MAX_STAR,
  MVP_DISCOUNT_PERCENT,
  MVP_GRADES,
  PC_ROOM_DISCOUNT_PERCENT,
  PLUS_ONE_MAX_STAR,
  PROTECTABLE_STARS,
  RESTORE_COEFFICIENTS,
  RESTORE_MESO,
  STARFORCE_MAX_LEVEL,
  restoreSpares,
} from "#/simulators/data/starforce-rules.ts";

export const PPM = 1_000_000;

export const starforceOptionsSchema = z.object({
  mvp: z.enum(MVP_GRADES),
  pcRoom: z.boolean(),
  discount30: z.boolean(),
  destroyReduction: z.boolean(),
  guarantee51015: z.boolean(),
  plusOne: z.boolean(),
  restoreDiscount: z.boolean(),
});
export type StarforceOptions = z.infer<typeof starforceOptionsSchema>;

export const DEFAULT_STARFORCE_OPTIONS: StarforceOptions = {
  mvp: "none",
  pcRoom: false,
  discount30: false,
  destroyReduction: false,
  guarantee51015: false,
  plusOne: false,
  restoreDiscount: false,
};

export const SHINING_STARFORCE = {
  discount30: true,
  destroyReduction: true,
  restoreDiscount: true,
} as const satisfies Partial<StarforceOptions>;

export const clampLevel = (level: number): number => Math.min(STARFORCE_MAX_LEVEL, Math.max(1, Math.trunc(level)));

export function maxStar(level: number): number {
  for (const [maxLevel, cap] of LEVEL_STAR_CAPS) if (level <= maxLevel) return cap;
  return 0;
}

export interface Chances {
  success: number;
  fail: number;
  destroy: number;
}

// Star catch is always on: success x1.05, the rest of the old fail mass split in its original ratio.
function starCatchChances(star: number): Chances {
  const [rate, destroyRate] = BASE_RATES[star];
  const success = rate * 105;
  const destroy = destroyRate === 0 ? 0 : Math.round((destroyRate * 100 * (PPM - success)) / (PPM - rate * 100));
  return { success, fail: PPM - success - destroy, destroy };
}

export const isGuaranteed = (star: number, options: StarforceOptions): boolean =>
  options.guarantee51015 && GUARANTEE_STARS.includes(star);

export const isProtectable = (star: number): boolean => PROTECTABLE_STARS.includes(star);

export const protectionApplies = (star: number, options: StarforceOptions, protect: boolean): boolean =>
  protect && isProtectable(star) && !isGuaranteed(star, options);

export function chances(star: number, options: StarforceOptions, protect: boolean): Chances {
  if (isGuaranteed(star, options)) return { success: PPM, fail: 0, destroy: 0 };
  const base = starCatchChances(star);
  let destroy = base.destroy;
  if (options.destroyReduction && star <= DESTROY_REDUCTION_MAX_STAR) destroy = Math.round((destroy * 7) / 10);
  if (protectionApplies(star, options, protect)) destroy = 0;
  return { success: base.success, fail: PPM - base.success - destroy, destroy };
}

// Round in integer hundredths of a percent; toFixed on 66.445 gives 66.44 from float error.
export const formatChance = (ppm: number): string => `${(Math.round(ppm / 100) / 100).toFixed(2)}%`;

export function baseCost(level: number, star: number): number {
  const exponent = star < 10 ? 1 : 2.7;
  return Math.round((1000 + (level ** 3 * (star + 1) ** exponent) / COST_DIVISORS[star]) / 100) * 100;
}

export const memberDiscountPercent = (star: number, options: StarforceOptions): number =>
  star <= MEMBER_DISCOUNT_MAX_STAR
    ? MVP_DISCOUNT_PERCENT[options.mvp] + (options.pcRoom ? PC_ROOM_DISCOUNT_PERCENT : 0)
    : 0;

export interface AttemptCost {
  base: number;
  discounted: number;
  protection: number;
  before: number;
  total: number;
}

export function attemptCost(level: number, star: number, options: StarforceOptions, protect: boolean): AttemptCost {
  const base = baseCost(level, star);
  const keep = (100 - memberDiscountPercent(star, options)) * (options.discount30 ? 70 : 100);
  const discounted = Math.floor((base * keep) / 10_000);
  const protection = protectionApplies(star, options, protect) ? base * 2 : 0;
  return { base, discounted, protection, before: base + protection, total: discounted + protection };
}

const roundSignificant = (value: number, digits: number): number => {
  const scale = 10 ** (Math.floor(Math.log10(value)) - digits + 1);
  return Math.round(value / scale) * scale;
};

export interface RestoreCost {
  meso: number;
  spares: number;
  estimated: boolean;
}

export function restoreCost(level: number, traceStar: number, options: StarforceOptions): RestoreCost {
  const listed = RESTORE_MESO[level]?.[traceStar];
  const meso = listed ?? roundSignificant(RESTORE_COEFFICIENTS[traceStar] * level ** 3, 3);
  return {
    meso: options.restoreDiscount ? Math.floor((meso * 8) / 10) : meso,
    spares: restoreSpares(traceStar),
    estimated: listed === undefined,
  };
}

export interface StarforceLedger {
  attempts: number;
  successes: number;
  failures: number;
  destroys: number;
  enhanceMeso: bigint;
  restoreMeso: bigint;
  spares: number;
}

export const EMPTY_LEDGER: StarforceLedger = {
  attempts: 0,
  successes: 0,
  failures: 0,
  destroys: 0,
  enhanceMeso: 0n,
  restoreMeso: 0n,
  spares: 0,
};

export interface StarforceState {
  level: number;
  star: number;
  trace: number | null;
  ledger: StarforceLedger;
}

export function initialStarforceState(level: number, star: number): StarforceState {
  const clamped = clampLevel(level);
  return {
    level: clamped,
    star: Math.min(Math.max(0, Math.trunc(star)), maxStar(clamped)),
    trace: null,
    ledger: EMPTY_LEDGER,
  };
}

export const canEnhance = (state: StarforceState): boolean => state.trace === null && state.star < maxStar(state.level);

export type EnhanceOutcome = "success" | "fail" | "protected" | "destroyed";

export interface EnhanceResult {
  state: StarforceState;
  outcome: EnhanceOutcome;
  from: number;
  to: number;
}

export function enhance(
  state: StarforceState,
  options: StarforceOptions,
  protect: boolean,
  roll: number,
): EnhanceResult | null {
  if (!canEnhance(state)) return null;
  const from = state.star;
  const odds = chances(from, options, protect);
  const cost = attemptCost(state.level, from, options, protect);
  const ledger = {
    ...state.ledger,
    attempts: state.ledger.attempts + 1,
    enhanceMeso: state.ledger.enhanceMeso + BigInt(cost.total),
  };
  if (roll < odds.success) {
    const step = options.plusOne && from <= PLUS_ONE_MAX_STAR ? 2 : 1;
    const to = Math.min(from + step, maxStar(state.level));
    return {
      state: { ...state, star: to, ledger: { ...ledger, successes: ledger.successes + 1 } },
      outcome: "success",
      from,
      to,
    };
  }
  if (roll >= PPM - odds.destroy) {
    return {
      state: {
        ...state,
        trace: Math.min(from, MAX_TRACE_STAR),
        ledger: { ...ledger, destroys: ledger.destroys + 1 },
      },
      outcome: "destroyed",
      from,
      to: from,
    };
  }
  const unprotectedDestroy = chances(from, options, false).destroy;
  const blocked = protectionApplies(from, options, protect) && roll >= PPM - unprotectedDestroy;
  return {
    state: { ...state, ledger: { ...ledger, failures: ledger.failures + 1 } },
    outcome: blocked ? "protected" : "fail",
    from,
    to: from,
  };
}

export type RestoreMode = "full" | "base";

export function restore(state: StarforceState, mode: RestoreMode, options: StarforceOptions): StarforceState {
  if (state.trace === null) return state;
  if (mode === "base") {
    return {
      ...state,
      star: BASE_RESTORE_STAR,
      trace: null,
      ledger: { ...state.ledger, spares: state.ledger.spares + 1 },
    };
  }
  const cost = restoreCost(state.level, state.trace, options);
  return {
    ...state,
    star: state.trace,
    trace: null,
    ledger: {
      ...state.ledger,
      restoreMeso: state.ledger.restoreMeso + BigInt(cost.meso),
      spares: state.ledger.spares + cost.spares,
    },
  };
}

export const ledgerTotal = (ledger: StarforceLedger, sparePrice: number): bigint =>
  ledger.enhanceMeso + ledger.restoreMeso + BigInt(ledger.spares) * BigInt(Math.trunc(sparePrice));

export const shouldStopAuto = (state: StarforceState, target: number): boolean =>
  !canEnhance(state) || state.star >= Math.min(target, maxStar(state.level));

const MESO_UNITS: ReadonlyArray<readonly [size: bigint, label: string]> = [
  [1_0000_0000_0000n, "조"],
  [1_0000_0000n, "억"],
  [1_0000n, "만"],
];

export function formatMeso(value: bigint): string {
  if (value === 0n) return "0";
  let rest = value;
  const parts: string[] = [];
  for (const [unit, label] of MESO_UNITS) {
    const q = rest / unit;
    if (q > 0n) parts.push(`${q}${label}`);
    rest %= unit;
  }
  if (rest > 0n) parts.push(String(rest));
  return parts.join(" ");
}

// The equipped item the session started from; null when the level was entered by hand.
export const starforceItemSchema = z.object({
  name: z.string(),
  icon: z.string(),
  part: z.string(),
});
export type StarforceItem = z.infer<typeof starforceItemSchema>;

export const starforceSettingsSchema = z.object({
  item: starforceItemSchema.nullable().default(null),
  level: z.number().int().min(1).max(STARFORCE_MAX_LEVEL),
  startStar: z.number().int().min(0).max(30),
  options: starforceOptionsSchema,
  sparePrice: z.number().int().min(0).max(MAX_MESO),
  effects: z.boolean(),
  autoTarget: z.number().int().min(1).max(30),
  autoProtect: z.array(z.number().int()),
});
export type StarforceSettings = z.infer<typeof starforceSettingsSchema>;

export const DEFAULT_STARFORCE_SETTINGS: StarforceSettings = {
  item: null,
  level: 200,
  startStar: 0,
  options: DEFAULT_STARFORCE_OPTIONS,
  sparePrice: 0,
  effects: true,
  autoTarget: 22,
  autoProtect: [],
};
