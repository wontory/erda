// KMS starforce rules as of the 2026-09-17 update.
// Official: base rates (2024-02-15 probability disclosure, 2025-03-20 update), the always-on 1.05x star catch
// bonus (2026-03-19 update), level caps, MVP/PC room discounts, protection cost, restore spare counts.
// Unofficial (community-collected, flagged in the UI): cost divisors from 10 stars and full-restore meso.
export const STARFORCE_RULES_DATE = "2026-09-17";

export const STARFORCE_MAX_LEVEL = 250;
export const MAX_TRACE_STAR = 22;
export const BASE_RESTORE_STAR = 12;

export const LEVEL_STAR_CAPS: ReadonlyArray<readonly [maxLevel: number, maxStar: number]> = [
  [94, 5],
  [107, 8],
  [117, 10],
  [127, 15],
  [137, 20],
  [250, 30],
];

// Success and destroy rates before the star catch bonus, in basis points (1/10,000), indexed by current star.
export const BASE_RATES: ReadonlyArray<readonly [success: number, destroy: number]> = [
  [9500, 0],
  [9000, 0],
  [8500, 0],
  [8500, 0],
  [8000, 0],
  [7500, 0],
  [7000, 0],
  [6500, 0],
  [6000, 0],
  [5500, 0],
  [5000, 0],
  [4500, 0],
  [4000, 0],
  [3500, 0],
  [3000, 0],
  [3000, 210],
  [3000, 210],
  [1500, 680],
  [1500, 680],
  [1500, 850],
  [3000, 1050],
  [1500, 1275],
  [1500, 1700],
  [1000, 1800],
  [1000, 1800],
  [1000, 1800],
  [700, 1860],
  [500, 1900],
  [300, 1940],
  [100, 1980],
];

// Divisor per current star. Stars 0~9 use exponent 1, the rest 2.7.
export const COST_DIVISORS: ReadonlyArray<number> = [
  36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 571, 314, 214, 157, 107, 200, 200, 150, 70, 45, 200, 125, 200, 200, 200, 200,
  200, 200, 200, 200,
];

export const PROTECTABLE_STARS: ReadonlyArray<number> = [15, 16, 17];
export const GUARANTEE_STARS: ReadonlyArray<number> = [5, 10, 15];
export const PLUS_ONE_MAX_STAR = 10;
export const DESTROY_REDUCTION_MAX_STAR = 21;
export const MEMBER_DISCOUNT_MAX_STAR = 16;

export const MVP_GRADES = ["none", "bronze", "silver", "gold", "diamond", "red", "black"] as const;
export type MvpGrade = (typeof MVP_GRADES)[number];

export const MVP_LABELS: Record<MvpGrade, string> = {
  none: "없음",
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  diamond: "다이아",
  red: "레드",
  black: "블랙",
};

export const MVP_DISCOUNT_PERCENT: Record<MvpGrade, number> = {
  none: 0,
  bronze: 0,
  silver: 3,
  gold: 5,
  diamond: 10,
  red: 10,
  black: 10,
};

export const PC_ROOM_DISCOUNT_PERCENT = 5;

// Full-restore meso by level, then trace star.
export const RESTORE_MESO: Readonly<Partial<Record<number, Readonly<Partial<Record<number, number>>>>>> = {
  130: { 15: 119_000_000, 16: 287_000_000, 17: 485_000_000, 18: 1_103_000_000, 19: 1_827_000_000 },
  135: { 15: 133_000_000, 16: 321_000_000, 17: 542_000_000, 18: 1_231_000_000, 19: 2_043_000_000 },
  140: {
    15: 149_000_000,
    16: 359_000_000,
    17: 606_000_000,
    18: 1_380_000_000,
    19: 2_280_000_000,
    20: 4_020_000_000,
    21: 5_050_000_000,
    22: 8_290_000_000,
  },
  150: {
    15: 183_000_000,
    16: 441_000_000,
    17: 745_000_000,
    18: 1_689_000_000,
    19: 2_803_000_000,
    20: 4_944_000_000,
    21: 6_224_000_000,
    22: 10_179_000_000,
  },
  160: {
    15: 222_000_000,
    16: 535_000_000,
    17: 904_000_000,
    18: 2_060_000_000,
    19: 3_410_000_000,
    20: 6_000_000_000,
    21: 7_540_000_000,
    22: 12_400_000_000,
  },
  200: {
    15: 433_000_000,
    16: 1_050_000_000,
    17: 1_770_000_000,
    18: 4_010_000_000,
    19: 6_650_000_000,
    20: 11_800_000_000,
    21: 14_800_000_000,
    22: 24_200_000_000,
  },
  250: {
    15: 846_000_000,
    16: 2_040_000_000,
    17: 3_450_000_000,
    18: 7_830_000_000,
    19: 13_000_000_000,
    20: 22_900_000_000,
    21: 28_800_000_000,
    22: 47_300_000_000,
  },
};

// Full-restore meso per L³ for levels missing above.
export const RESTORE_COEFFICIENTS: Readonly<Record<number, number>> = {
  15: 54.15,
  16: 130.7,
  17: 220.7,
  18: 501.5,
  19: 831.3,
  20: 1465.3,
  21: 1842,
  22: 3025,
};

export function restoreSpares(traceStar: number): number {
  if (traceStar >= 22) return 4;
  if (traceStar === 21) return 3;
  if (traceStar >= 19) return 2;
  return 1;
}
