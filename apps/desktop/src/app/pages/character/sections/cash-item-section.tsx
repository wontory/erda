import { getCharacterCashitemEquipment } from "@erda/api/generated/endpoints/character/character";
import type { CharacterCashItemEquipment } from "@erda/api/generated/model";
import { presetNo, TimeFormat } from "@erda/core";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import { IconRow } from "./icon-row.tsx";
import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";

type CashItems = NonNullable<CharacterCashItemEquipment["cash_item_equipment_base"]>;
type CashItem = CashItems[number];

function CashItemRow({ item }: { item: CashItem }) {
  const description = [
    item.cash_item_equipment_part,
    item.cash_item_label,
    item.date_expire ? `~${TimeFormat.shortDate(item.date_expire)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return <IconRow icon={item.cash_item_icon} iconSize={28} title={item.cash_item_name} description={description} />;
}

export function CashItemSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section
      id="cashItem"
      ocid={ocid}
      icon={ShoppingBag}
      fetcher={(p) => getCharacterCashitemEquipment({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const current = presetNo(d.preset_no, 3);
        const { active, worn } = resolvePreset(preset, current);
        const pick = (base: unknown[] | null | undefined, presets: Array<unknown[] | null | undefined>) =>
          ((worn ? base : presetAt(active, presets)) ?? []) as CashItems;
        const items = pick(d.cash_item_equipment_base, [
          d.cash_item_equipment_preset_1,
          d.cash_item_equipment_preset_2,
          d.cash_item_equipment_preset_3,
        ]);
        const extra = pick(d.additional_cash_item_equipment_base, [
          d.additional_cash_item_equipment_preset_1,
          d.additional_cash_item_equipment_preset_2,
          d.additional_cash_item_equipment_preset_3,
        ]);
        const lookMode = lookModeLabel(d.character_look_mode, d.character_class);
        const row = (it: CashItem, i: number) => <CashItemRow key={`${it.cash_item_equipment_slot}-${i}`} item={it} />;
        return (
          <>
            <PresetPicker count={3} value={active} current={current} onChange={setPreset} />
            {lookMode ? <div className="px-2 text-[11px] text-muted-foreground">{lookMode}</div> : null}
            {items.map(row)}
            {extra.length > 0 ? (
              <>
                <SubHeading className="mt-2">추가 외형</SubHeading>
                {extra.map(row)}
              </>
            ) : null}
          </>
        );
      }}
    </Section>
  );
}

function lookModeLabel(mode: string | undefined, characterClass: string | undefined): string | null {
  if (mode !== "1") return null;
  if (characterClass?.includes("제로")) return "베타 외형";
  if (characterClass?.includes("엔젤릭버스터")) return "드레스 업 모드";
  return "특수 외형 모드";
}
