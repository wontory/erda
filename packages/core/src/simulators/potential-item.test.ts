import { describe, expect, it } from "vitest";

import { potentialCandidate, potentialPart, type PotentialEquipLike } from "./potential-item.ts";

const WEAPON: PotentialEquipLike = {
  item_name: "아케인셰이드 투핸드소드",
  item_icon: "https://open.api.nexon.com/static/maplestory/item/icon/ABC",
  item_equipment_part: "두손검",
  item_equipment_slot: "무기",
  item_base_option: { base_equipment_level: 200 },
  potential_option_grade: "레전드리",
  potential_option_1: "보스 몬스터 데미지 +40%",
  potential_option_2: "공격력 +9%",
  potential_option_3: null,
  additional_potential_option_grade: null,
  soul_potential_grade: "에픽",
  soul_potential_amplified_grade: 2,
  soul_potential_option_1: "공격력 +3%",
};

describe("potentialPart", () => {
  it("maps API slots to the probability table parts", () => {
    expect(potentialPart("무기", "두손검")).toBe(1);
    expect(potentialPart("엠블렘", "엠블렘")).toBe(2);
    expect(potentialPart("보조무기", "블레이드")).toBe(3);
    expect(potentialPart("보조무기", "포스실드")).toBe(4);
    expect(potentialPart("보조무기", "방패")).toBe(5);
    expect(potentialPart("상의", "한벌옷")).toBe(8);
    expect(potentialPart("반지3", "반지")).toBe(18);
    expect(potentialPart("펜던트2", "펜던트")).toBe(19);
    expect(potentialPart("기계 심장", "기계 심장")).toBe(20);
    expect(potentialPart("포켓 아이템", "포켓 아이템")).toBeNull();
  });
});

describe("potentialCandidate", () => {
  it("starts from the equipped grades, lines and soul step", () => {
    expect(potentialCandidate(WEAPON)).toEqual({
      item: { name: WEAPON.item_name, icon: WEAPON.item_icon, part: "두손검" },
      slot: "무기",
      part: 1,
      level: 200,
      soulStep: 2,
      start: {
        main: { grade: "legendary", texts: ["보스 몬스터 데미지 +40%", "공격력 +9%"] },
        additional: undefined,
        soul: { grade: "epic", texts: ["공격력 +3%"] },
      },
    });
  });

  it("ignores soul potential outside weapons and slots without potential", () => {
    expect(potentialCandidate({ ...WEAPON, item_equipment_slot: "모자" })?.start.soul).toBeUndefined();
    expect(potentialCandidate({ ...WEAPON, item_equipment_slot: "뱃지" })).toBeNull();
  });
});
