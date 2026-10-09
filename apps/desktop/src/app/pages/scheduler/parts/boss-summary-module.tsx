import { CYCLE_META, KoreanNumber, TimeFormat, nextReset, type BossCycle } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";
import { Progress } from "@erda/ui/components/ui/progress";
import { listItem } from "@erda/ui/lib/motion";
import { Coins } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";
import type { BossView } from "#/features/boss/view.ts";

const PLACEHOLDER = "—";

export function BossSummaryModule({ view, cycle, now }: { view: BossView; cycle: BossCycle; now: Date }) {
  const { summary } = view;
  const ready = view.status === "ready";
  const compact = (n: number) => (ready ? KoreanNumber.compact(n) : PLACEHOLDER);
  const mesoHelp = (n: number) => (ready ? `${KoreanNumber.format(n)} 메소` : undefined);
  return (
    <Module title="요약" icon={Coins}>
      <div className="grid grid-cols-3 gap-3">
        <Metric
          title="클리어 수익"
          value={<RollingValue value={compact(summary.clearRevenue)} />}
          tint="text-primary"
          help={mesoHelp(summary.clearRevenue)}
        />
        <Metric
          title="예상 수익"
          value={<RollingValue value={compact(summary.expectedRevenue)} />}
          help={mesoHelp(summary.expectedRevenue)}
        />
        <Metric
          title="클리어"
          value={<RollingValue value={ready ? `${summary.cleared}/${summary.total}` : PLACEHOLDER} />}
        />
      </div>
      <Progress
        aria-label={`${CYCLE_META[cycle].title} 보스 클리어`}
        className="mt-2.5 [&_[data-slot=progress-indicator]]:bg-green-500 [&_[data-slot=progress-track]]:h-1.5"
        value={ready ? summary.cleared : 0}
        max={ready ? summary.total : 1}
      />
      <AnimatePresence initial={false}>
        {ready && view.weeklyLimit ? (
          <m.div key="limit" {...listItem}>
            <div className="pt-1.5 text-[11px] text-muted-foreground">
              주간 보스 {view.weeklyLimit.count}/{view.weeklyLimit.limit}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{CYCLE_META[cycle].resetLabel}</span>
        <span>초기화 {TimeFormat.relative(nextReset(cycle, now), now)}</span>
      </div>
    </Module>
  );
}
