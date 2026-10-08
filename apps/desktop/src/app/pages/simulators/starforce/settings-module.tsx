import { MVP_LABELS, type StarforceItem, type StarforceOptions } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Module } from "@erda/ui/components/module";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { Switch } from "@erda/ui/components/ui/switch";
import { CircleHelp, Settings2, Sparkles, Sword, TicketPercent } from "lucide-react";
import { useId } from "react";

import { LinkRow } from "#/app/pages/shared/link-row.tsx";

import { StarCount } from "./star-count.tsx";

const EVENT_FLAGS = ["discount30", "destroyReduction", "guarantee51015", "plusOne", "restoreDiscount"] as const;

function optionsSummary(options: StarforceOptions): string {
  const parts: string[] = [];
  const events = EVENT_FLAGS.filter((f) => options[f]).length;
  if (events > 0) parts.push(`이벤트 ${events}개`);
  if (options.mvp !== "none") parts.push(`MVP ${MVP_LABELS[options.mvp]}`);
  if (options.pcRoom) parts.push("PC방");
  return parts.length > 0 ? parts.join(" · ") : "없음";
}

export function SettingsModule({
  item,
  level,
  startStar,
  destroyed,
  options,
  effects,
  onEditItem,
  onOpenOptions,
  onEffects,
  onOpenInfo,
}: {
  item: StarforceItem | null;
  level: number;
  startStar: number;
  destroyed: boolean;
  options: StarforceOptions;
  effects: boolean;
  onEditItem: () => void;
  onOpenOptions: () => void;
  onEffects: (on: boolean) => void;
  onOpenInfo: () => void;
}) {
  const id = useId();
  return (
    <Module title="설정" icon={Settings2}>
      <LinkRow
        media={<IconTile icon={Sword} color="bg-blue-500" />}
        title="장비"
        value={
          <>
            {item ? `${item.part} · ` : ""}Lv.{level}
            {destroyed ? " · 파괴됨" : ""} · 시작 <StarCount>{startStar}</StarCount>
          </>
        }
        onClick={onEditItem}
      />
      <LinkRow
        media={<IconTile icon={TicketPercent} color="bg-amber-500" />}
        title="이벤트·할인"
        value={optionsSummary(options)}
        onClick={onOpenOptions}
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
