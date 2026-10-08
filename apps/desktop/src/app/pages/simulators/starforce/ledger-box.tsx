import { formatMeso, ledgerTotal, type StarforceLedger } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";
import { History } from "lucide-react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

export function LedgerBox({ ledger, sparePrice }: { ledger: StarforceLedger; sparePrice: number }) {
  const spareMeso = BigInt(ledger.spares) * BigInt(sparePrice);
  return (
    <Module title="강화 기록" icon={History}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2 px-0.5">
          <Metric title="시도" value={<RollingValue value={String(ledger.attempts)} />} />
          <Metric title="성공" value={<RollingValue value={String(ledger.successes)} />} />
          <Metric title="실패" value={<RollingValue value={String(ledger.failures)} />} />
          <Metric
            title="파괴"
            value={<RollingValue value={String(ledger.destroys)} />}
            tint={ledger.destroys > 0 ? "text-destructive" : undefined}
          />
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-foreground/4 px-2.5 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] text-muted-foreground">총 사용 메소</span>
            <span className="text-[15px] font-semibold text-(--sf-gold) tabular-nums">
              <RollingValue value={formatMeso(ledgerTotal(ledger, sparePrice))} />
            </span>
          </div>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
            <dt>강화</dt>
            <dd className="m-0 text-right">{formatMeso(ledger.enhanceMeso)}</dd>
            <dt>복구 메소</dt>
            <dd className="m-0 text-right">{formatMeso(ledger.restoreMeso)}</dd>
            <dt>스페어 {ledger.spares}개</dt>
            <dd className="m-0 text-right">{sparePrice > 0 ? formatMeso(spareMeso) : "가격 미입력"}</dd>
          </dl>
        </div>
      </div>
    </Module>
  );
}
