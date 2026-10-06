import { describeError } from "@erda/api/errors";
import { SECTION_META } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { SectionHeader } from "@erda/ui/components/section-header";
import { Target } from "lucide-react";

import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useInView } from "#/features/character/use-in-view.ts";
import { useBattle } from "#/features/insights/use-battle.ts";

import { ReplayCard } from "./replay-card.tsx";

export function BattleSection({ ocid }: { ocid: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const b = useBattle(inView ? ocid : null);
  const meta = SECTION_META.battle;
  const settled = !b.isIdle && !b.isLoading;
  return (
    <div ref={ref} className="flex flex-col gap-2.5">
      <Module>
        <SectionHeader title={meta.title} color={meta.color} icon={Target} />
        {b.isIdle || b.isLoading ? <LoadingRow label="리플레이 불러오는 중…" /> : null}
        {settled && b.error ? <ErrorRow message={describeError(b.error)} onRetry={b.retry} /> : null}
        {settled && !b.error && b.replays.length === 0 ? (
          <EmptyState icon={Target} title="저장된 리플레이가 없어요" />
        ) : null}
      </Module>
      {b.replays.map((r, i) => (
        <ReplayCard key={r.id} replay={r} result={b.results[i]} />
      ))}
    </div>
  );
}
