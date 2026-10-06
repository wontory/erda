import {
  getCharacterItemEquipment,
  getCharacterSymbolEquipment,
} from "@erda/api/generated/endpoints/character/character";
import type { CharacterItemEquipmentItemEquipmentItem as EquipItem } from "@erda/api/generated/model";
import { averageStarforce, gradeColorClass, legendaryCount, presetNo, symbolForceSums } from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { Info, Shield, Star } from "lucide-react";
import { useState } from "react";

import { Inspectable } from "#/app/pages/character/inspector/inspectable.tsx";
import { useExtra } from "#/features/character/use-extra.ts";
import { useInspector } from "#/features/inspector/use-inspector.ts";

import { IconRow } from "./icon-row.tsx";
import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { Section } from "./section.tsx";

type Inspector = ReturnType<typeof useInspector>;

function ItemSummary({ item }: { item: EquipItem }) {
  const star =
    item.starforce && item.starforce !== "0" ? (
      <span className="inline-flex items-center gap-0.5 align-middle text-warning">
        <Star className="size-3 fill-current" />
        {item.starforce}
      </span>
    ) : null;
  const potential = item.potential_option_grade;
  const additional = item.additional_potential_option_grade;
  return (
    <span>
      {item.item_equipment_slot ?? item.item_equipment_part}
      {star ? <> · {star}</> : null}
      {potential ? (
        <>
          {" · "}
          <span className={gradeColorClass(potential)}>{potential}</span>
        </>
      ) : null}
      {additional ? (
        <>
          {" · 에디 "}
          <span className={gradeColorClass(additional)}>{additional}</span>
        </>
      ) : null}
    </span>
  );
}

function ItemRow({ item, inspector }: { item: EquipItem; inspector: Inspector }) {
  return (
    <Inspectable inspector={inspector} payload={{ kind: "item", item }}>
      <Item size="row" className="w-full">
        <ItemMedia>
          <GameIcon src={item.item_icon} size={32} alt="" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>{item.item_name}</ItemTitle>
          <ItemDescription>
            <ItemSummary item={item} />
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Info size={14} className="text-muted-foreground" />
        </ItemActions>
      </Item>
    </Inspectable>
  );
}

function SymbolForce({ arcane, authentic }: { arcane: number; authentic: number }) {
  return (
    <div className="min-w-0">
      <div className="text-[20px] leading-tight font-semibold whitespace-nowrap tabular-nums">
        {arcane + authentic > 0 ? `${arcane} / ${authentic}` : "-"}
      </div>
      <div className="text-[11px] leading-tight text-muted-foreground">심볼 포스 (아케인/어센틱)</div>
    </div>
  );
}

export function EquipmentSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  const inspector = useInspector();
  const symbols = useExtra("symbols", ocid, (p) => getCharacterSymbolEquipment({ ocid }, { nexonCache: p }));
  const force = symbolForceSums(symbols.data?.symbol ?? []);
  return (
    <Section
      id="equipment"
      ocid={ocid}
      icon={Shield}
      fetcher={(p) => getCharacterItemEquipment({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const current = presetNo(d.preset_no, 3);
        const { active, worn } = resolvePreset(preset, current);
        const items =
          (worn
            ? d.item_equipment
            : presetAt(active, [d.item_equipment_preset_1, d.item_equipment_preset_2, d.item_equipment_preset_3])) ??
          [];
        const avg = averageStarforce(items);
        const title = d.title;
        const companions = [...(d.dragon_equipment ?? []), ...(d.mechanic_equipment ?? [])];
        return (
          <>
            <PresetPicker count={3} value={active} current={current} onChange={setPreset} />
            <div className="mb-2 grid grid-cols-3 gap-3">
              <Metric title="평균 스타포스" value={avg !== null ? `★${avg}` : "-"} tint="text-warning" />
              <Metric title="레전드리 잠재" value={`${legendaryCount(items)}개`} tint="text-grade-legendary" />
              <SymbolForce arcane={force.arcane} authentic={force.authentic} />
            </div>
            {title?.title_name ? (
              <Inspectable inspector={inspector} payload={{ kind: "title", title }}>
                <IconRow
                  className="w-full"
                  icon={title.title_icon}
                  iconSize={32}
                  title={title.title_name}
                  description="칭호"
                />
              </Inspectable>
            ) : null}
            {items.map((it, i) => (
              <ItemRow key={`${it.item_equipment_part}-${i}`} item={it} inspector={inspector} />
            ))}
            {companions.length > 0 ? (
              <Module title="드래곤 · 메카닉 장비" className="mt-2">
                {companions.map((it, i) => (
                  <ItemRow
                    key={`dm-${i}`}
                    item={{ ...it, item_equipment_slot: it.equipment_slot }}
                    inspector={inspector}
                  />
                ))}
              </Module>
            ) : null}
          </>
        );
      }}
    </Section>
  );
}
