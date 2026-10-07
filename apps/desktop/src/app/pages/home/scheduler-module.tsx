import { KoreanNumber } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Progress } from "@erda/ui/components/ui/progress";
import { CalendarCheck } from "lucide-react";

import { RollingValue } from "#/app/pages/scheduler/parts/rolling-value.tsx";
import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";
import { useBossView } from "#/features/boss/use-boss-view.ts";
import type { BossView } from "#/features/boss/view.ts";

function statusText(view: BossView) {
  if (view.status === "loading") return view.mode === "scheduler" ? "스케줄러 불러오는 중…" : "불러오는 중…";
  if (view.status === "error") return "스케줄러를 불러오지 못했어요";
  return "스케줄러 데이터 없음";
}

export function SchedulerModule({ onOpen }: { onOpen: () => void }) {
  const view = useBossView("weekly");
  const { summary } = view;
  return (
    <Module
      title="스케줄러"
      icon={CalendarCheck}
      onOpen={onOpen}
      trailing={<TrailingText>{view.mode === "scheduler" ? "연동" : "직접"}</TrailingText>}
    >
      {view.status === "ready" ? (
        <>
          <div className="flex items-baseline justify-between">
            <span
              className="text-[17px] font-semibold tabular-nums"
              title={`${KoreanNumber.format(summary.clearRevenue)} 메소`}
            >
              <RollingValue value={KoreanNumber.compact(summary.clearRevenue)} />
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              <RollingValue value={`${summary.cleared}/${summary.total}`} />
            </span>
          </div>
          <Progress
            aria-label="이번 주 보스 클리어"
            className="mt-1.5 [&_[data-slot=progress-indicator]]:bg-green-500"
            value={summary.cleared}
            max={summary.total}
          />
          <div className="mt-1 text-[11px] text-muted-foreground">이번 주 클리어 수익</div>
        </>
      ) : (
        <div className="text-[11px] text-muted-foreground">{statusText(view)}</div>
      )}
    </Module>
  );
}
