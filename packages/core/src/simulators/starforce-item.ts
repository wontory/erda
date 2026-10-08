import { parseNumber } from "#/character/summary.ts";

import { clampLevel, maxStar, type StarforceItem } from "./starforce.ts";

export interface EquipLike {
  item_name?: string | null;
  item_icon?: string | null;
  item_equipment_part?: string | null;
  item_equipment_slot?: string | null;
  item_base_option?: { base_equipment_level?: number | null } | null;
  starforce?: string | null;
  starforce_scroll_flag?: string | null;
  scroll_upgrade?: string | null;
  scroll_upgradable_count?: string | null;
  scroll_resilience_count?: string | null;
}

export interface StarforceCandidate {
  item: StarforceItem;
  slot: string;
  level: number;
  star: number;
}

// Superior items run on their own star table, which the simulator doesn't model.
const SUPERIOR = /^타일런트 /;
const AMAZING_ENHANCEMENT = "사용";

// An equipped item the simulator can start from, or null when regular starforce doesn't apply to it:
// no upgrade slots ever (emblems, badges, event rings), Amazing Enhancement stars, superior items, or
// a level with no stars.
export function starforceCandidate(equip: EquipLike): StarforceCandidate | null {
  const name = equip.item_name ?? "";
  if (!name || SUPERIOR.test(name) || equip.starforce_scroll_flag === AMAZING_ENHANCEMENT) return null;
  const star = parseNumber(equip.starforce);
  const slots =
    parseNumber(equip.scroll_upgrade) +
    parseNumber(equip.scroll_upgradable_count) +
    parseNumber(equip.scroll_resilience_count);
  if (star === 0 && slots === 0) return null;
  const rawLevel = equip.item_base_option?.base_equipment_level ?? 0;
  if (rawLevel <= 0) return null;
  const level = clampLevel(rawLevel);
  const cap = maxStar(level);
  if (cap === 0) return null;
  const part = equip.item_equipment_part ?? "";
  return {
    item: { name, icon: equip.item_icon ?? "", part },
    slot: equip.item_equipment_slot ?? part,
    level,
    star: Math.min(star, cap),
  };
}
