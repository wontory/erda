import { formatMeso, ledgerTotal, type StarforceLedger } from "@erda/core";

import { SfBox } from "./sf-parts.tsx";

export function LedgerBox({
  ledger,
  sparePrice,
  onReset,
}: {
  ledger: StarforceLedger;
  sparePrice: number;
  onReset: () => void;
}) {
  const spareMeso = BigInt(ledger.spares) * BigInt(sparePrice);
  return (
    <SfBox title="강화 기록">
      <div className="grid grid-cols-4 gap-1 text-center text-[11px] tabular-nums">
        {[
          ["시도", ledger.attempts],
          ["성공", ledger.successes],
          ["실패", ledger.failures],
          ["파괴", ledger.destroys],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <span className="text-(--sf-muted)">{label}</span>
            <span className={`font-bold ${label === "파괴" && Number(value) > 0 ? "text-(--sf-danger)" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2 border-t border-(--sf-box-edge) pt-1.5 text-[12px]">
        <span className="text-(--sf-muted)">총 사용 메소</span>
        <span className="font-bold text-(--sf-gold) tabular-nums">{formatMeso(ledgerTotal(ledger, sparePrice))}</span>
      </div>
      <dl className="m-0 mt-0.5 grid grid-cols-[auto_1fr] gap-x-3 text-[11px] text-(--sf-muted) tabular-nums">
        <dt>강화</dt>
        <dd className="m-0 text-right">{formatMeso(ledger.enhanceMeso)}</dd>
        <dt>복구 메소</dt>
        <dd className="m-0 text-right">{formatMeso(ledger.restoreMeso)}</dd>
        <dt>스페어 {ledger.spares}개</dt>
        <dd className="m-0 text-right">{sparePrice > 0 ? formatMeso(spareMeso) : "가격 미입력"}</dd>
      </dl>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 w-full text-right text-[10px] text-(--sf-muted) underline-offset-2 hover:underline"
      >
        기록 초기화
      </button>
    </SfBox>
  );
}
