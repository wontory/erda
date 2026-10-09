import { HISTORY_META, type HistoryAggregate, type HistoryKind } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@erda/ui/components/ui/item";
import { Package } from "lucide-react";
import { useState } from "react";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";

const PREVIEW_COUNT = 5;

export function ItemUsage({ kind, agg }: { kind: HistoryKind; agg: HistoryAggregate }) {
  const [all, setAll] = useState(false);
  if (agg.items.length === 0) return null;
  const items = all ? agg.items : agg.items.slice(0, PREVIEW_COUNT);
  const goodLabel = HISTORY_META[kind].goodLabel;
  return (
    <Module title="아이템별 사용" icon={Package}>
      {items.map((it) => (
        <Item key={it.key} size="row">
          <ItemContent className="min-w-0">
            <ItemTitle>{it.target}</ItemTitle>
            <ItemDescription>
              {[it.part, it.stack !== null ? `${it.stack}스택` : null].filter(Boolean).join(" · ") || undefined}
            </ItemDescription>
          </ItemContent>
          <ItemValue>
            {it.uses}회 · {goodLabel} {it.good}
          </ItemValue>
        </Item>
      ))}
      {agg.items.length > PREVIEW_COUNT ? (
        <Button variant="ghost" onClick={() => setAll((v) => !v)}>
          {all ? "접기" : `전체 보기 (${agg.items.length}종)`}
        </Button>
      ) : null}
    </Module>
  );
}
