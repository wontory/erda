export type SymbolKind = "arcane" | "authentic";

export function symbolKind(name: string): SymbolKind | null {
  if (name.includes("어센틱")) return "authentic";
  if (name.includes("아케인")) return "arcane";
  return null;
}

export const symbolMaxLevel = (kind: SymbolKind) => (kind === "arcane" ? 20 : 11);

export const symbolRequirement = (kind: SymbolKind, level: number) =>
  kind === "arcane" ? level * level + 11 : 9 * level * level + 20 * level;

function requirementsFrom(kind: SymbolKind, fromLevel: number): number {
  let total = 0;
  for (let l = fromLevel; l < symbolMaxLevel(kind); l++) total += symbolRequirement(kind, l);
  return total;
}

export function symbolRemaining(kind: SymbolKind, level: number, growth: number, apiRequire: number): number {
  if (level >= symbolMaxLevel(kind)) return 0;
  const current = apiRequire > 0 ? apiRequire : symbolRequirement(kind, level);
  return Math.max(0, current - growth + requirementsFrom(kind, level + 1));
}

export function symbolDays(remaining: number, daily: number): number | null {
  if (remaining <= 0) return 0;
  if (daily <= 0) return null;
  return Math.ceil(remaining / daily);
}

export function symbolTotal(kind: SymbolKind): number {
  return requirementsFrom(kind, 1);
}

export interface SymbolCalcInput {
  name: string;
  level: number;
  growth: number;
  require: number;
}

export type SymbolSummary = "모두 만렙" | "레벨업만 남음" | `약 ${number}일 남음` | "성장치 설정 필요" | null;

function summarizeKind(items: SymbolCalcInput[], kind: SymbolKind, daily: number): SymbolSummary {
  const mine = items.filter((i) => symbolKind(i.name) === kind);
  if (mine.length === 0) return null;
  const remaining = mine.map((i) => symbolRemaining(kind, i.level, i.growth, i.require));
  if (remaining.every((r) => r === 0)) {
    return mine.every((i) => i.level >= symbolMaxLevel(kind)) ? "모두 만렙" : "레벨업만 남음";
  }
  const days = remaining.map((r) => symbolDays(r, daily));
  if (days.some((d) => d === null)) return "성장치 설정 필요";
  const slowest = Math.max(...days.map((d) => d ?? 0));
  return slowest === 0 ? "레벨업만 남음" : `약 ${slowest}일 남음`;
}

export function summarizeSymbols(
  items: SymbolCalcInput[],
  daily: { arcane: number; authentic: number },
): { arcane: SymbolSummary; authentic: SymbolSummary } {
  return {
    arcane: summarizeKind(items, "arcane", daily.arcane),
    authentic: summarizeKind(items, "authentic", daily.authentic),
  };
}
