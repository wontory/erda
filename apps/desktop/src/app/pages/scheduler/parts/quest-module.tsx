import { CYCLE_META, type BossCycle, type HomeworkItem } from "@erda/core";
import { CheckCircle } from "@erda/ui/components/check-circle";
import { Module } from "@erda/ui/components/module";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { cn } from "@erda/ui/lib/utils";
import { ListChecks } from "lucide-react";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";

export function QuestModule({ cycle, items }: { cycle: BossCycle; items: HomeworkItem[] }) {
  if (cycle === "monthly" || items.length === 0) return null;
  return (
    <Module title={`${CYCLE_META[cycle].title} 퀘스트`} icon={ListChecks}>
      {items.map((h) => (
        <Item key={h.key} size="row">
          <ItemMedia>
            <CheckCircle checked={h.done} label={h.shortName} />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>
              <span className={cn(h.done && "text-muted-foreground line-through")} title={h.name}>
                {h.shortName}
              </span>
            </ItemTitle>
          </ItemContent>
          {h.progress ? <ItemValue>{h.progress}</ItemValue> : null}
        </Item>
      ))}
    </Module>
  );
}
