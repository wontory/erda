import {
  getCharacterItemEquipment,
  getCharacterSymbolEquipment,
} from "@erda/api/generated/endpoints/character/character";
import { getUserUnion } from "@erda/api/generated/endpoints/union/union";
import { averageStarforce, formatStat, type CharacterSummary, type DetailPage } from "@erda/core";

import { nullIfNotFound } from "./queries.ts";
import { useExtra } from "./use-extra.ts";

type DetailBundle = ReturnType<typeof useDetailBundle>;

export function useDetailBundle(ocid: string, enabled = true) {
  const equipment = useExtra("equipment", ocid, (p) => getCharacterItemEquipment({ ocid }, { nexonCache: p }), {
    enabled,
  });
  const symbols = useExtra("symbols", ocid, (p) => getCharacterSymbolEquipment({ ocid }, { nexonCache: p }), {
    enabled,
  });
  const union = useExtra("union", ocid, (p) => getUserUnion({ ocid }, { nexonCache: p }).catch(nullIfNotFound), {
    enabled,
  });
  return { equipment, symbols, union };
}

function statsValue(summary: CharacterSummary): string | undefined {
  const stat = (name: string) => summary.stats.find((s) => s.name === name);
  const boss = stat("보스 몬스터 데미지");
  const ignore = stat("방어율 무시");
  if (!boss || !ignore) return undefined;
  return `보공 ${formatStat(boss.name, boss.value)} · 방무 ${formatStat(ignore.name, ignore.value)}`;
}

function equipmentValue(bundle: DetailBundle): string | undefined {
  if (!bundle.equipment.data) return undefined;
  const items = bundle.equipment.data.item_equipment ?? [];
  const avg = averageStarforce(items);
  const symbolCount = bundle.symbols.data?.symbol?.length;
  const parts = [`${items.length}개`];
  if (avg !== null) parts.push(`평균 ★${avg}`);
  if (symbolCount !== undefined) parts.push(`심볼 ${symbolCount}`);
  return parts.join(" · ");
}

function unionValue(bundle: DetailBundle): string | undefined {
  const level = bundle.union.data?.union_level;
  if (level) return `Lv.${level}`;
  return bundle.union.isFetched ? "-" : undefined;
}

export function detailRowValues(summary: CharacterSummary, bundle: DetailBundle): Partial<Record<DetailPage, string>> {
  return {
    stats: statsValue(summary),
    equipment: equipmentValue(bundle),
    skills: summary.classLevel ? `${summary.classLevel}차 전직` : undefined,
    union: unionValue(bundle),
  };
}
