import {
  POTENTIAL_GRADES,
  POTENTIAL_GRADE_LABELS,
  POTENTIAL_PARTS,
  SOUL_STEPS,
  WEAPON_PART,
  type PotentialGrade,
  type PotentialKind,
} from "#/simulators/data/potential-rules.ts";

import { clampPotentialLevel, type PotentialItem } from "./potential.ts";

export interface PotentialEquipLike {
  item_name?: string | null;
  item_icon?: string | null;
  item_equipment_part?: string | null;
  item_equipment_slot?: string | null;
  item_base_option?: { base_equipment_level?: number | null } | null;
  potential_option_grade?: string | null;
  potential_option_1?: string | null;
  potential_option_2?: string | null;
  potential_option_3?: string | null;
  additional_potential_option_grade?: string | null;
  additional_potential_option_1?: string | null;
  additional_potential_option_2?: string | null;
  additional_potential_option_3?: string | null;
  soul_potential_grade?: string | null;
  soul_potential_amplified_grade?: number | null;
  soul_potential_option_1?: string | null;
  soul_potential_option_2?: string | null;
  soul_potential_option_3?: string | null;
}

export interface PotentialStart {
  grade: PotentialGrade;
  texts: readonly string[];
}

export interface PotentialCandidate {
  item: PotentialItem;
  slot: string;
  part: number;
  level: number;
  soulStep: number;
  start: Partial<Record<PotentialKind, PotentialStart>>;
}

const SECONDARY_PARTS: Readonly<Record<string, number>> = { 포스실드: 4, 소울링: 4, 방패: 5 };

export function potentialPart(slot: string, part: string): number | null {
  if (slot === "무기") return WEAPON_PART;
  if (slot === "보조무기") return SECONDARY_PARTS[part] ?? 3;
  if (part === "한벌옷") return 8;
  if (slot.startsWith("반지")) return 18;
  if (slot.startsWith("펜던트")) return 19;
  const index = (POTENTIAL_PARTS as readonly string[]).indexOf(slot.replace(/\s/g, ""));
  return index >= 0 ? index + 1 : null;
}

export function parseGrade(label: string | null | undefined): PotentialGrade | null {
  return POTENTIAL_GRADES.find((g) => POTENTIAL_GRADE_LABELS[g] === label) ?? null;
}

function startOf(grade: string | null | undefined, lines: (string | null | undefined)[]): PotentialStart | undefined {
  const parsed = parseGrade(grade);
  if (!parsed) return undefined;
  return { grade: parsed, texts: lines.filter((l): l is string => !!l) };
}

export function potentialCandidate(equip: PotentialEquipLike): PotentialCandidate | null {
  const name = equip.item_name ?? "";
  const slot = equip.item_equipment_slot ?? "";
  const partLabel = equip.item_equipment_part ?? "";
  if (!name) return null;
  const part = potentialPart(slot, partLabel);
  if (part === null) return null;
  const start: Partial<Record<PotentialKind, PotentialStart>> = {
    main: startOf(equip.potential_option_grade, [
      equip.potential_option_1,
      equip.potential_option_2,
      equip.potential_option_3,
    ]),
    additional: startOf(equip.additional_potential_option_grade, [
      equip.additional_potential_option_1,
      equip.additional_potential_option_2,
      equip.additional_potential_option_3,
    ]),
    soul:
      part === WEAPON_PART
        ? startOf(equip.soul_potential_grade, [
            equip.soul_potential_option_1,
            equip.soul_potential_option_2,
            equip.soul_potential_option_3,
          ])
        : undefined,
  };
  const step = Math.trunc(equip.soul_potential_amplified_grade ?? 0);
  return {
    item: { name, icon: equip.item_icon ?? "", part: partLabel },
    slot: slot || partLabel,
    part,
    level: clampPotentialLevel(equip.item_base_option?.base_equipment_level ?? 0),
    soulStep: Math.min(SOUL_STEPS.length, Math.max(1, step)),
    start,
  };
}
