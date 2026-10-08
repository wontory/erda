import { KoreanNumber, type BossSummary, type HomeworkItem } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Progress } from "@erda/ui/components/ui/progress";
import { Separator } from "@erda/ui/components/ui/separator";
import { CalendarCheck } from "lucide-react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";
import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";
import { useBossView } from "#/features/boss/use-boss-view.ts";
import type { BossView } from "#/features/boss/view.ts";

function statusText(view: BossView) {
  if (view.status === "loading") return view.mode === "scheduler" ? "스케줄러 불러오는 중…" : "불러오는 중…";
  if (view.status === "error") return "스케줄러를 불러오지 못했어요";
  return "스케줄러 데이터 없음";
}

function SectionHead({ label, count }: { label: string; count: string }) {
  return (
    <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">
        <RollingValue value={count} />
      </span>
    </div>
  );
}

function BossRevenue({ summary }: { summary: BossSummary }) {
  return (
    <section aria-label="이번 주 결정석 수익">
      <SectionHead label="결정석 수익" count={`${summary.cleared}/${summary.total}`} />
      <div
        className="mt-0.5 text-[17px] font-semibold tabular-nums"
        title={`${KoreanNumber.format(summary.clearRevenue)} 메소`}
      >
        <RollingValue value={KoreanNumber.compact(summary.clearRevenue)} />
      </div>
      <Progress
        aria-label="이번 주 보스 클리어"
        className="mt-1.5 [&_[data-slot=progress-indicator]]:bg-green-500"
        value={summary.cleared}
        max={summary.total}
      />
    </section>
  );
}

function WeeklyHomework({ items }: { items: HomeworkItem[] }) {
  const done = items.filter((h) => h.done).length;
  return (
    <section aria-label="주간 퀘스트 진행률">
      <SectionHead label="주간 퀘스트" count={`${done}/${items.length}`} />
      <Progress aria-label="주간 퀘스트 진행률" className="mt-1.5" value={done} max={items.length} />
    </section>
  );
}

export function SchedulerModule({ onOpen }: { onOpen: () => void }) {
  const view = useBossView("weekly");
  return (
    <Module
      title="스케줄러"
      icon={CalendarCheck}
      onOpen={onOpen}
      trailing={<TrailingText>{view.mode === "scheduler" ? "연동" : "직접"}</TrailingText>}
    >
      {view.status === "ready" ? (
        <>
          <BossRevenue summary={view.summary} />
          {view.homework.length > 0 ? (
            <>
              <Separator className="my-2.5" />
              <WeeklyHomework items={view.homework} />
            </>
          ) : null}
        </>
      ) : (
        <div className="text-[11px] text-muted-foreground">{statusText(view)}</div>
      )}
    </Module>
  );
}
