import type { BossRow } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { Swap } from "@erda/ui/components/swap";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@erda/ui/components/ui/collapsible";
import { listItem } from "@erda/ui/lib/motion";
import { ChevronDown, Crown } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import type { BossStatus } from "#/features/boss/view.ts";

import { BossRowView } from "./boss-row-view.tsx";

function UnregisteredBosses({ rows }: { rows: BossRow[] }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded-lg px-2 py-1 text-left text-[12px] text-muted-foreground transition-colors duration-100 ease-out outline-none hover:bg-glass-card-hover focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronDown
          size={14}
          aria-hidden
          className="transition-transform duration-200 ease-snappy group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
        />
        등록 안 된 보스 {rows.length}개
      </CollapsibleTrigger>
      <CollapsibleContent>
        {rows.map((r) => (
          <BossRowView key={r.key} row={r} dimmed />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReadyRows({
  rows,
  unregistered,
  staleError,
}: {
  rows: BossRow[];
  unregistered: BossRow[];
  staleError: string | null;
}) {
  return (
    <>
      {rows.length === 0 ? (
        <div className="px-2 py-2 text-[12px] text-muted-foreground">이 주기에 등록한 보스가 없어요</div>
      ) : (
        rows.map((r) => <BossRowView key={r.key} row={r} />)
      )}
      <AnimatePresence initial={false}>
        {staleError ? (
          <m.div key="stale" {...listItem}>
            <div className="line-clamp-2 px-2 pt-1.5 text-[11px] text-muted-foreground">
              갱신하지 못했어요 · {staleError}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
      <div className="mt-1.5 px-2 text-[11px] text-muted-foreground">게임에서 처치하면 자동으로 체크돼요.</div>
      <AnimatePresence initial={false}>
        {unregistered.length > 0 ? (
          <m.div key="unregistered" {...listItem}>
            <div className="pt-1.5">
              <UnregisteredBosses rows={unregistered} />
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function SchedulerSection({
  status,
  errorMessage,
  staleError,
  rows,
  unregistered,
  onRetry,
}: {
  status: BossStatus;
  errorMessage: string | null;
  staleError: string | null;
  rows: BossRow[];
  unregistered: BossRow[];
  onRetry: () => void;
}) {
  return (
    <Module title="등록한 보스" icon={Crown}>
      <AutoHeight>
        <Swap id={status}>
          {status === "loading" ? <LoadingRow label="스케줄러 불러오는 중…" /> : null}
          {status === "error" ? (
            <ErrorRow message={errorMessage ?? "스케줄러를 불러오지 못했어요"} onRetry={onRetry} />
          ) : null}
          {status === "empty" ? (
            <EmptyState icon={Crown} title="데이터 없음" description="오늘 게임에 접속한 뒤 다시 확인해 주세요" />
          ) : null}
          {status === "ready" ? <ReadyRows rows={rows} unregistered={unregistered} staleError={staleError} /> : null}
        </Swap>
      </AutoHeight>
    </Module>
  );
}
