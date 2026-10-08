import { describe, expect, it } from "vitest";

import { starforceCandidate, type EquipLike } from "./starforce-item.ts";

const ARCANE: EquipLike = {
  item_name: "아케인셰이드 투핸드소드",
  item_icon: "https://open.api.nexon.com/static/maplestory/item/icon/ABC",
  item_equipment_part: "두손검",
  item_equipment_slot: "무기",
  item_base_option: { base_equipment_level: 200 },
  starforce: "22",
  starforce_scroll_flag: "미사용",
  scroll_upgrade: "9",
  scroll_upgradable_count: "0",
  scroll_resilience_count: "0",
};

describe("starforceCandidate", () => {
  it("starts from the equipped level and stars", () => {
    expect(starforceCandidate(ARCANE)).toEqual({
      item: { name: "아케인셰이드 투핸드소드", icon: ARCANE.item_icon, part: "두손검" },
      slot: "무기",
      level: 200,
      star: 22,
    });
  });

  it("keeps unstarred items that still have upgrade slots", () => {
    expect(
      starforceCandidate({ ...ARCANE, starforce: "0", scroll_upgrade: "0", scroll_upgradable_count: "7" })?.star,
    ).toBe(0);
  });

  it("skips items that never had upgrade slots", () => {
    expect(starforceCandidate({ ...ARCANE, starforce: "0", scroll_upgrade: "0" })).toBeNull();
  });

  it("skips Amazing Enhancement and superior items", () => {
    expect(starforceCandidate({ ...ARCANE, starforce_scroll_flag: "사용" })).toBeNull();
    expect(starforceCandidate({ ...ARCANE, item_name: "타일런트 하데스 망토" })).toBeNull();
  });

  it("caps stars at the level's maximum", () => {
    expect(
      starforceCandidate({ ...ARCANE, item_base_option: { base_equipment_level: 130 }, starforce: "22" })?.star,
    ).toBe(20);
  });
});
