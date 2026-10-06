import {
  HISTORY_META,
  historySubtitle,
  kstToday,
  statusLine,
  type HistoryAggregate,
  type HistoryDay as Day,
  type HistoryKind,
  type SyncPhase,
} from "@erda/core";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { cn } from "@erda/ui/lib/utils";
import { useEffect, useMemo, useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { DailyBars } from "#/app/pages/insights/parts/daily-bars.tsx";
import { HistoryDay } from "#/app/pages/insights/parts/history-day.tsx";
import { HistoryMetrics } from "#/app/pages/insights/parts/history-metrics.tsx";
import { ItemUsage } from "#/app/pages/insights/parts/item-usage.tsx";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useNow } from "#/features/boss/use-now.ts";
import { useHistory } from "#/features/insights/history-store.ts";
import { historyIcon } from "#/features/insights/icons.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

const DAYS_PER_PAGE = 7;

function emptyCopy(phase: SyncPhase): { title: string; description?: string } {
  switch (phase) {
    case "syncing":
      return {
        title: "기록을 받는 중이에요",
        description: "처음엔 오늘부터 받아요. 오래된 기록은 천천히 이어 받아요.",
      };
    case "paused":
      return { title: "기록 받기를 잠시 쉬고 있어요", description: "위의 시각이 지나면 이어서 받아요." };
    case "error":
      return { title: "기록을 받지 못했어요", description: "새로고침으로 다시 시도할 수 있어요." };
    case "done":
      return { title: "기록이 없어요" };
    case "idle":
      return { title: "기록을 준비하는 중이에요" };
  }
}

function HistoryBody({
  kind,
  aggregate,
  days,
  today,
  shown,
  onMore,
}: {
  kind: HistoryKind;
  aggregate: HistoryAggregate;
  days: Day[];
  today: string;
  shown: number;
  onMore: () => void;
}) {
  return (
    <>
      <HistoryMetrics kind={kind} agg={aggregate} />
      <DailyBars kind={kind} agg={aggregate} />
      <ItemUsage kind={kind} agg={aggregate} />
      {days.slice(0, shown).map((d, i) => (
        <div key={d.id} className={i >= DAYS_PER_PAGE ? "animate-in duration-150 fade-in" : undefined}>
          <HistoryDay day={d} today={today} />
        </div>
      ))}
      {days.length > shown ? (
        <Button variant="outline" size="sm" onClick={onMore}>
          더 보기
        </Button>
      ) : null}
    </>
  );
}

export function HistoryPage({ kind }: { kind: HistoryKind }) {
  const { pop } = useNav();
  const h = useHistory(kind);
  const now = useNow();
  const today = kstToday(now);
  const [shown, setShown] = useState(DAYS_PER_PAGE);
  const { open, epoch } = h;
  useEffect(() => {
    open().catch((e) => console.error("failed to open history", e));
  }, [open, epoch]);
  const days = useMemo(() => (h.archive?.days ?? []).filter((d) => d.entries.length > 0), [h.archive]);
  const phase = h.state.phase;
  const copy = emptyCopy(phase);
  return (
    <>
      <ScreenHeader
        title={HISTORY_META[kind].title}
        subtitle={h.archive ? (historySubtitle(h.archive, today) ?? undefined) : undefined}
        onBack={pop}
        trailing={
          <RefreshButton
            onClick={() => runAction(() => h.refresh(), "기록을 새로 받지 못했어요")}
            loading={phase === "syncing"}
          />
        }
        onSettings={() => openSettingsAction("general")}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <output
          className={cn(
            "block px-1 text-[11px] empty:hidden",
            phase === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {statusLine(h.state, now.getTime())}
        </output>
        {!h.archive || !h.aggregate ? (
          <LoadingRow label="기록 불러오는 중…" />
        ) : h.aggregate.total === 0 ? (
          <EmptyState icon={historyIcon(kind)} title={copy.title} description={copy.description} />
        ) : (
          <HistoryBody
            kind={kind}
            aggregate={h.aggregate}
            days={days}
            today={today}
            shown={shown}
            onMore={() => setShown((n) => n + DAYS_PER_PAGE)}
          />
        )}
      </div>
    </>
  );
}
