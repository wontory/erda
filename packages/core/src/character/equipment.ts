import { parseNumber } from "./summary.ts";
import { symbolKind } from "./symbol-calc.ts";

interface StarItem {
  starforce?: string | null;
  potential_option_grade?: string | null;
}

type OptionValue = string | number | null | undefined;
type Option = Record<string, OptionValue> | null | undefined;

interface OptionItem {
  item_total_option?: Option;
  item_base_option?: Option;
  item_add_option?: Option;
  item_etc_option?: Option;
  item_starforce_option?: Option;
}

type OptionSource = "base" | "add" | "etc" | "star";

const SOURCE_FIELD: Record<OptionSource, keyof OptionItem> = {
  base: "item_base_option",
  add: "item_add_option",
  etc: "item_etc_option",
  star: "item_starforce_option",
};

const ALL_SOURCES: OptionSource[] = ["base", "add", "etc", "star"];

export const BREAKDOWN_STATS: Array<{ key: string; label: string; sources: OptionSource[] }> = [
  { key: "str", label: "STR", sources: ALL_SOURCES },
  { key: "dex", label: "DEX", sources: ALL_SOURCES },
  { key: "int", label: "INT", sources: ALL_SOURCES },
  { key: "luk", label: "LUK", sources: ALL_SOURCES },
  { key: "max_hp", label: "최대 HP", sources: ALL_SOURCES },
  { key: "max_mp", label: "최대 MP", sources: ALL_SOURCES },
  { key: "attack_power", label: "공격력", sources: ALL_SOURCES },
  { key: "magic_power", label: "마력", sources: ALL_SOURCES },
  { key: "armor", label: "방어력", sources: ALL_SOURCES },
  { key: "all_stat", label: "올스탯 %", sources: ["base", "add"] },
  { key: "boss_damage", label: "보스 데미지 %", sources: ["base", "add"] },
  { key: "ignore_monster_armor", label: "방어율 무시 %", sources: ["base"] },
  { key: "damage", label: "데미지 %", sources: ["add"] },
];

const LEGENDARY = "레전드리";

export function averageStarforce(items: StarItem[]): number | null {
  const stars = items.map((i) => parseNumber(i.starforce)).filter((n) => n > 0);
  if (stars.length === 0) return null;
  const average = stars.reduce((a, b) => a + b, 0) / stars.length;
  return Math.round(average * 10) / 10;
}

export const legendaryCount = (items: StarItem[]) => items.filter((i) => i.potential_option_grade === LEGENDARY).length;

export function symbolForceSums(symbols: Array<{ symbol_name?: string | null; symbol_force?: string | null }>) {
  return symbols.reduce(
    (acc, s) => {
      const kind = symbolKind(s.symbol_name ?? "");
      if (kind) acc[kind] += parseNumber(s.symbol_force);
      return acc;
    },
    { arcane: 0, authentic: 0 },
  );
}

const nonZero = (v: OptionValue) => (v && String(v) !== "0" ? String(v) : null);

function sourceValue(item: OptionItem, sources: OptionSource[], source: OptionSource, key: string): string | null {
  return sources.includes(source) ? nonZero(item[SOURCE_FIELD[source]]?.[key]) : null;
}

export function optionBreakdown(item: OptionItem) {
  const total = item.item_total_option ?? {};
  return BREAKDOWN_STATS.filter((s) => nonZero(total[s.key])).map((s) => ({
    label: s.label,
    total: String(total[s.key]),
    base: sourceValue(item, s.sources, "base", s.key),
    add: sourceValue(item, s.sources, "add", s.key),
    etc: sourceValue(item, s.sources, "etc", s.key),
    star: sourceValue(item, s.sources, "star", s.key),
  }));
}
