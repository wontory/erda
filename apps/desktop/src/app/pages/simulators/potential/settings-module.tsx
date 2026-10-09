import { POTENTIAL_PARTS, WEAPON_PART, type PotentialItem } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Module } from "@erda/ui/components/module";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { Switch } from "@erda/ui/components/ui/switch";
import { CircleHelp, Settings2, Sparkles, Sword } from "lucide-react";
import { useId } from "react";

import { LinkRow } from "#/app/pages/shared/link-row.tsx";

export function SettingsModule({
  item,
  part,
  level,
  soulStep,
  onEditItem,
  effects,
  onEffects,
  onOpenInfo,
}: {
  item: PotentialItem | null;
  part: number;
  level: number;
  soulStep: number;
  onEditItem: () => void;
  effects: boolean;
  onEffects: (on: boolean) => void;
  onOpenInfo: () => void;
}) {
  const id = useId();
  return (
    <Module title="설정" icon={Settings2}>
      <LinkRow
        media={<IconTile icon={Sword} color="bg-blue-500" />}
        title="장비"
        value={`${item ? item.part : POTENTIAL_PARTS[part - 1]} · Lv.${level}${part === WEAPON_PART ? ` · 증폭 ${soulStep}단계` : ""}`}
        onClick={onEditItem}
      />
      <Item size="row" render={(props) => <label htmlFor={id} {...props} />}>
        <ItemMedia>
          <IconTile icon={Sparkles} color="bg-purple-500" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>강화 연출</ItemTitle>
        </ItemContent>
        <ItemActions>
          <Switch id={id} size="sm" checked={effects} onCheckedChange={(on) => onEffects(on)} />
        </ItemActions>
      </Item>
      <LinkRow media={<IconTile icon={CircleHelp} color="bg-zinc-500" />} title="규칙 안내" onClick={onOpenInfo} />
    </Module>
  );
}
