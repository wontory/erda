import { z } from "zod";

import {
  BASE_RATES,
  COST_DIVISORS,
  DESTROY_REDUCTION_MAX_STAR,
  GUARANTEE_STARS,
  LEVEL_STAR_CAPS,
  MEMBER_DISCOUNT_MAX_STAR,
  MVP_DISCOUNT_PERCENT,
  MVP_GRADES,
  PC_ROOM_DISCOUNT_PERCENT,
  PROTECTABLE_STARS,
  RESTORE_COEFFICIENTS,
  RESTORE_MESO,
  STARFORCE_MAX_LEVEL,
  restoreSpares,
} from "#/calculators/data/starforce-rules.ts";

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

export const formatChance = (ppm: number): string => `${(ppm / 10_000).toFixed(2)}%`;

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
