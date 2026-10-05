const ORDER = ["스킬 코어", "마스터리 코어", "강화 코어", "공용 코어"];
const FALLBACK_TYPE = "기타";

function orderRank(type: string): number {
  const i = ORDER.indexOf(type);
  return i === -1 ? ORDER.length : i;
}

export function groupHexaCores<T extends { hexa_core_type?: string | null }>(
  cores: T[],
): Array<{ type: string; cores: T[] }> {
  const byType = new Map<string, T[]>();
  for (const core of cores) {
    const type = core.hexa_core_type ?? FALLBACK_TYPE;
    const group = byType.get(type);
    if (group) group.push(core);
    else byType.set(type, [core]);
  }
  return [...byType.entries()]
    .toSorted((a, b) => orderRank(a[0]) - orderRank(b[0]))
    .map(([type, grouped]) => ({ type, cores: grouped }));
}
