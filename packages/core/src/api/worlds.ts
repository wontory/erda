export const WORLDS = [
  "스카니아",
  "베라",
  "루나",
  "제니스",
  "크로아",
  "유니온",
  "엘리시움",
  "이노시스",
  "레드",
  "오로라",
  "아케인",
  "노바",
  "에오스",
  "핼리오스",
  "챌린저스",
  "챌린저스2",
  "챌린저스3",
  "챌린저스4",
] as const;

export type WorldName = (typeof WORLDS)[number];

export const isWorld = (x: unknown): x is WorldName => (WORLDS as readonly unknown[]).includes(x);

export const WORLD_ICON_NUMBERS: Record<string, number> = {
  헬리오스: 2,
  핼리오스: 2,
  에오스: 3,
  오로라: 4,
  레드: 5,
  이노시스: 6,
  유니온: 7,
  스카니아: 8,
  루나: 9,
  제니스: 10,
  크로아: 11,
  베라: 12,
  엘리시움: 13,
  아케인: 14,
  노바: 15,
  챌린저스: 20,
  챌린저스2: 21,
  챌린저스3: 22,
  챌린저스4: 23,
};

export function worldIconUrl(world: string): string | null {
  const n = WORLD_ICON_NUMBERS[world];
  return n ? `https://ssl.nexon.com/s2/game/maplestory/renewal/common/world_icon/icon_${n}.png` : null;
}
