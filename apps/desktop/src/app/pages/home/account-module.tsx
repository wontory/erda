import { HISTORY_KINDS, HISTORY_META, rootSummary } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { UserRound } from "lucide-react";

import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";
import { useHistorySummaries } from "#/features/insights/history-store.ts";
import { useCallsToday } from "#/features/insights/use-calls-today.ts";

export function AccountModule({ onOpen }: { onOpen: () => void }) {
  const summaries = useHistorySummaries();
  const calls = useCallsToday();
  const trailing = (
    <TrailingText className="tabular-nums" tone={calls.over ? "text-warning" : undefined}>
      오늘 호출 {calls.calls ?? "—"}/{calls.budget}
    </TrailingText>
  );
  return (
    <Module title="내 계정" icon={UserRound} onOpen={onOpen} trailing={trailing}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
        {HISTORY_KINDS.map((k) => (
          <div key={k} className="flex min-w-0 justify-between gap-2">
            <span className="text-muted-foreground">{HISTORY_META[k].title}</span>
            <span className="truncate tabular-nums">{rootSummary(summaries[k].aggregate, summaries[k].state)}</span>
          </div>
        ))}
      </div>
    </Module>
  );
}
