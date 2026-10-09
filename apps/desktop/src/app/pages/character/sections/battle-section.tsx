import { describeError } from "@erda/api/errors";
import { SECTION_META } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { SectionHeader } from "@erda/ui/components/section-header";
import { StackItem } from "@erda/ui/components/stack-item";
import { Swap } from "@erda/ui/components/swap";
import { Target } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useInView } from "#/features/character/use-in-view.ts";
import { useBattle } from "#/features/insights/use-battle.ts";

import { ReplayCard } from "./replay-card.tsx";

export function BattleSection({ ocid }: { ocid: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const b = useBattle(inView ? ocid : null);
  const meta = SECTION_META.battle;
  const settled = !b.isIdle && !b.isLoading;
  const view = b.isIdle || b.isLoading ? "loading" : b.error ? "error" : b.replays.length === 0 ? "empty" : "data";
  return (
    <div ref={ref} className="flex flex-col gap-2.5">
      <AnimatePresence mode="popLayout" initial={false}>
        <StackItem key="summary">
          <Module>
            <SectionHeader title={meta.title} color={meta.color} icon={Target} />
            <AutoHeight>
              <Swap id={view}>
                {view === "loading" ? <LoadingRow label="리플레이 불러오는 중…" /> : null}
                {settled && b.error ? <ErrorRow message={describeError(b.error)} onRetry={b.retry} /> : null}
                {view === "empty" ? <EmptyState icon={Target} title="저장된 리플레이가 없어요" /> : null}
              </Swap>
            </AutoHeight>
          </Module>
        </StackItem>
        {b.replays.map((r, i) => (
          <StackItem key={r.id}>
            <ReplayCard replay={r} result={b.results[i]} />
          </StackItem>
        ))}
      </AnimatePresence>
    </div>
  );
}
