export const POTENTIAL_RULES_DATE = "2026-09-17";

export const POTENTIAL_MAX_LEVEL = 250;

export const POTENTIAL_GRADES = ["rare", "epic", "unique", "legendary"] as const;
export type PotentialGrade = (typeof POTENTIAL_GRADES)[number];

export const POTENTIAL_GRADE_LABELS: Record<PotentialGrade, string> = {
  rare: "레어",
  epic: "에픽",
  unique: "유니크",
  legendary: "레전드리",
};

export const POTENTIAL_KINDS = ["main", "additional", "soul"] as const;
export type PotentialKind = (typeof POTENTIAL_KINDS)[number];

export const POTENTIAL_KIND_LABELS: Record<PotentialKind, string> = {
  main: "잠재능력",
  additional: "에디셔널",
  soul: "소울",
};

type GradeMeso = readonly [rare: number, epic: number, unique: number, legendary: number];

export const RESET_MESO_BANDS: ReadonlyArray<readonly [minLevel: number, main: GradeMeso, additional: GradeMeso]> = [
  [250, [5_000_000, 20_000_000, 42_500_000, 50_000_000], [12_250_000, 34_300_000, 83_300_000, 98_000_000]],
  [200, [4_500_000, 18_000_000, 38_250_000, 45_000_000], [11_000_000, 30_800_000, 74_800_000, 88_000_000]],
  [160, [4_250_000, 17_000_000, 36_125_000, 42_500_000], [10_375_000, 29_050_000, 70_550_000, 83_000_000]],
  [0, [4_000_000, 16_000_000, 34_000_000, 40_000_000], [9_750_000, 27_300_000, 66_300_000, 78_000_000]],
];

export const SOUL_RESET_MESO: GradeMeso = [20_000_000, 40_000_000, 65_000_000, 88_000_000];

export const SOUL_STEPS = [1, 2, 3, 4] as const;

export const POTENTIAL_PARTS = [
  "무기",
  "엠블렘",
  "보조무기",
  "포스실드·소울링",
  "방패",
  "모자",
  "상의",
  "한벌옷",
  "하의",
  "신발",
  "장갑",
  "망토",
  "벨트",
  "어깨장식",
  "얼굴장식",
  "눈장식",
  "귀고리",
  "반지",
  "펜던트",
  "기계심장",
] as const;

export const WEAPON_PART = 1;

export const LINE_LIMITS: ReadonlyArray<{ pattern: RegExp; max: number }> = [
  { pattern: /^<쓸만한 /, max: 1 },
  { pattern: /^피격 후 무적시간/, max: 1 },
  { pattern: /^피격 시 \d+% 확률로 데미지의 \d+% 무시$/, max: 2 },
  { pattern: /^피격 시 \d+% 확률로 \d+초간 무적$/, max: 2 },
];

export type PotentialTable = "main" | "additional" | "gold" | "silver" | "bronze";

export const POTENTIAL_METHODS = ["meso", "black", "gold", "silver", "white", "bronze", "prime"] as const;
export type PotentialMethod = (typeof POTENTIAL_METHODS)[number];

export interface MethodRule {
  label: string;
  table: PotentialTable | "soul";
  upgradePpm: readonly number[];
  ceilings: readonly number[] | null;
  minGrade: PotentialGrade;
  maxGrade: PotentialGrade;
  fixFirst: boolean;
  meso: boolean;
}

const MAIN_UPGRADE = { upgradePpm: [150_000, 35_000, 14_000], ceilings: [10, 42, 107] };
const PRIME = {
  upgradePpm: [],
  ceilings: null,
  minGrade: "legendary",
  maxGrade: "legendary",
  fixFirst: true,
  meso: false,
} as const;
const ANY_GRADE = { minGrade: "rare", maxGrade: "legendary", fixFirst: false } as const;

export const METHOD_RULES: Readonly<Record<PotentialKind, Readonly<Partial<Record<PotentialMethod, MethodRule>>>>> = {
  main: {
    meso: { label: "메소", table: "main", ...MAIN_UPGRADE, ...ANY_GRADE, meso: true },
    black: { label: "블랙 큐브", table: "main", ...MAIN_UPGRADE, ...ANY_GRADE, meso: false },
    gold: {
      label: "골드 큐브",
      table: "gold",
      upgradePpm: [79_994, 16_959, 1_996],
      ceilings: null,
      ...ANY_GRADE,
      meso: false,
    },
    silver: {
      label: "실버 큐브",
      table: "silver",
      upgradePpm: [47_619, 11_858],
      ceilings: null,
      ...ANY_GRADE,
      maxGrade: "unique",
      meso: false,
    },
    prime: { label: "프라임 큐브", table: "main", ...PRIME },
  },
  additional: {
    meso: {
      label: "메소",
      table: "additional",
      upgradePpm: [23_810, 9_804, 7_000],
      ceilings: [62, 152, 214],
      ...ANY_GRADE,
      meso: true,
    },
    white: {
      label: "화이트 에디셔널 큐브",
      table: "additional",
      upgradePpm: [47_619, 19_608, 7_000],
      ceilings: [31, 76, 214],
      ...ANY_GRADE,
      meso: false,
    },
    bronze: {
      label: "브론즈 에디셔널 큐브",
      table: "bronze",
      upgradePpm: [4_000],
      ceilings: null,
      ...ANY_GRADE,
      maxGrade: "epic",
      meso: false,
    },
    prime: { label: "프라임 에디셔널 큐브", table: "additional", ...PRIME },
  },
  soul: {
    meso: {
      label: "메소",
      table: "soul",
      upgradePpm: [15_000, 5_875, 3_322],
      ceilings: [100, 256, 451],
      ...ANY_GRADE,
      meso: true,
    },
  },
};
