import {
  RESULT_LABEL,
  daySectionLabel,
  timeOfDay,
  type HistoryDay as Day,
  type HistoryEntry,
  type HistoryResult,
} from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { ArrowUp, Check, Flame, Minus, X, type LucideIcon } from "lucide-react";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";
import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";

const RESULT_ICON: Record<HistoryResult, [LucideIcon, string]> = {
  success: [Check, "text-success"],
  upgrade: [ArrowUp, "text-success"],
  fail: [X, "text-warning"],
  destroy: [Flame, "text-danger"],
  keep: [Minus, "text-muted-foreground"],
};
const MAX_ROWS = 100;

const joinParts = (parts: Array<string | null | undefined>) => parts.filter(Boolean).join(" · ");

function EntryRow({ entry: e }: { entry: HistoryEntry }) {
  const [Icon, tint] = RESULT_ICON[e.result];
  const sub = joinParts([RESULT_LABEL[e.result], e.headline, e.character, e.flags.join(", ")]);
  const right = joinParts([e.stack !== null ? `${e.stack}스택` : null, timeOfDay(e.date)]);
  return (
    <div>
      <Item size="row">
        <ItemMedia>
          <Icon size={16} className={tint} aria-hidden />
          <span className="sr-only">{RESULT_LABEL[e.result]}</span>
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>{e.target}</ItemTitle>
          <ItemDescription>{sub}</ItemDescription>
        </ItemContent>
        <ItemValue className="text-[11px]">{right}</ItemValue>
      </Item>
      {e.details.length > 0 ? (
        <div className="-mt-1 pb-1 pl-9 text-[11px] text-muted-foreground">{e.details.join(" / ")}</div>
      ) : null}
    </div>
  );
}

export function HistoryDay({ day, today }: { day: Day; today: string }) {
  return (
    <Module title={daySectionLabel(day.id, today)} trailing={<TrailingText>{day.entries.length}건</TrailingText>}>
      {day.entries.slice(0, MAX_ROWS).map((e, i) => (
        <EntryRow key={`${e.id}|${i}`} entry={e} />
      ))}
      {day.entries.length > MAX_ROWS ? (
        <div className="px-2 py-1 text-[11px] text-muted-foreground">{day.entries.length - MAX_ROWS}건 더 있어요</div>
      ) : null}
    </Module>
  );
}
