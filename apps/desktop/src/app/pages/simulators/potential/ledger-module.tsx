import { POTENTIAL_KIND_LABELS, formatMeso, type PotentialKind, type PotentialLedger } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";
import { History } from "lucide-react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

export function LedgerModule({ kind, ledger }: { kind: PotentialKind; ledger: PotentialLedger }) {
  return (
    <Module title={`${POTENTIAL_KIND_LABELS[kind]} 기록`} icon={History}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 px-0.5">
          <Metric title="재설정" value={<RollingValue value={String(ledger.resets)} />} />
          <Metric title="등급 상승" value={<RollingValue value={String(ledger.upgrades)} />} />
        </div>
        <div className="flex items-baseline justify-between gap-2 rounded-lg bg-foreground/4 px-2.5 py-2">
          <span className="text-[12px] text-muted-foreground">총 사용 메소</span>
          <span className="text-[15px] font-semibold text-warning tabular-nums">
            <RollingValue value={formatMeso(ledger.meso)} />
          </span>
        </div>
      </div>
    </Module>
  );
}
