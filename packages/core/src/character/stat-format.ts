import { KoreanNumber } from "#/format/korean-number.ts";

import type { CharacterSummary, StatEntry } from "./types.ts";

export const PERCENT_STATS: ReadonlySet<string> = new Set([
  "데미지",
  "최종 데미지",
  "보스 몬스터 데미지",
  "일반 몬스터 데미지",
  "방어율 무시",
  "크리티컬 확률",
  "크리티컬 데미지",
  "버프 지속시간",
  "상태이상 내성",
  "스탠스",
  "메소 획득량",
  "아이템 드롭률",
  "소환수 지속시간 증가",
  "추가 경험치 획득",
  "공격 속도",
  "재사용 대기시간 감소 (%)",
  "재사용 대기시간 미적용",
  "속성 내성 무시",
  "상태이상 추가 데미지",
  "무기 숙련도",
]);

export const isPercentStat = (name: string) => PERCENT_STATS.has(name) || name.endsWith("%)");

function trimZeros(value: string): string {
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

export function formatStat(name: string, value: string): string {
  const trimmed = trimZeros(value.trim());
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return value;
  if (isPercentStat(name)) return `${trimmed}%`;
  if (Number.isInteger(n) && Math.abs(n) >= 1000) return KoreanNumber.grouped(n);
  return trimmed;
}

const find = (stats: StatEntry[], name: string) => stats.find((s) => s.name === name);

function show(stats: StatEntry[], name: string): string {
  const s = find(stats, name);
  return s ? formatStat(name, s.value) : "-";
}

export function keyStats(summary: CharacterSummary) {
  const { stats } = summary;
  const attack = Number(find(stats, "공격력")?.value ?? 0);
  const magic = Number(find(stats, "마력")?.value ?? 0);
  const attackName = magic > attack ? "마력" : "공격력";
  return {
    power: summary.battlePower > 0 ? KoreanNumber.truncateToMan(summary.battlePower) : "-",
    powerFull: KoreanNumber.grouped(summary.battlePower),
    boss: show(stats, "보스 몬스터 데미지"),
    ignoreDefense: show(stats, "방어율 무시"),
    grid: [
      ["크리 데미지", show(stats, "크리티컬 데미지")],
      ["최종 데미지", show(stats, "최종 데미지")],
      ["스타포스", show(stats, "스타포스")],
      ["아케인포스", show(stats, "아케인포스")],
      ["어센틱포스", show(stats, "어센틱포스")],
      [attackName, show(stats, attackName)],
    ] as Array<[string, string]>,
  };
}

export const STAT_GROUPS: Array<{ title: string; names: string[] }> = [
  {
    title: "주요",
    names: [
      "보스 몬스터 데미지",
      "방어율 무시",
      "최종 데미지",
      "크리티컬 데미지",
      "크리티컬 확률",
      "데미지",
      "공격력",
      "마력",
    ],
  },
  { title: "기본", names: ["STR", "DEX", "INT", "LUK", "HP", "MP"] },
];

const AP_PREFIX = "AP 배분";
const BATTLE_POWER = "전투력";

export function groupStats(stats: StatEntry[]): Array<{ title: string; rows: StatEntry[] }> {
  const used = new Set<string>();
  const groups = STAT_GROUPS.map((g) => {
    const rows = g.names.map((n) => find(stats, n)).filter((s): s is StatEntry => !!s);
    rows.forEach((r) => used.add(r.name));
    return { title: g.title, rows };
  });
  const apStats = stats.filter((s) => s.name.startsWith(AP_PREFIX));
  apStats.forEach((s) => used.add(s.name));
  const ap = apStats.map((s) => ({ name: s.name.replace(/^AP 배분\s*/, ""), value: s.value }));
  const rest = stats.filter((s) => !used.has(s.name) && s.name !== BATTLE_POWER);
  return [...groups, { title: AP_PREFIX, rows: ap }, { title: "기타", rows: rest }];
}
