import type { BossRow } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { Swap } from "@erda/ui/components/swap";
import { Button } from "@erda/ui/components/ui/button";
import { Crown } from "lucide-react";

import { EmptyState } from "#/app/pages/shared/empty-state.tsx";

import { BossRowView } from "./boss-row-view.tsx";

export function ManualList({
  rows,
  loading,
  onToggle,
  onEdit,
}: {
  rows: BossRow[];
  loading: boolean;
  onToggle: (id: string) => void;
  onEdit: () => void;
}) {
  return (
    <Module title="보스" icon={Crown}>
      <AutoHeight>
        <Swap id={loading ? "loading" : rows.length === 0 ? "empty" : "rows"}>
          {loading ? (
            <LoadingRow />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Crown}
              title="고른 보스가 없어요"
              description="편집에서 이 주기에 잡는 보스를 골라 주세요"
              action={
                <Button variant="outline" onClick={onEdit}>
                  편집
                </Button>
              }
            />
          ) : (
            rows.map((r) => {
              const id = r.catalogId;
              return <BossRowView key={r.key} row={r} onToggle={id ? () => onToggle(id) : undefined} />;
            })
          )}
        </Swap>
      </AutoHeight>
    </Module>
  );
}
