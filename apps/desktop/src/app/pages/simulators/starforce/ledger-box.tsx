import { formatMeso, ledgerTotal, type StarforceLedger } from "@erda/core";
import { ChevronDown, RotateCcw } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

import { SF_PANEL, SF_TITLE } from "./theme.ts";

export function LedgerBox({
  ledger,
  sparePrice,
  onReset,
}: {
  ledger: StarforceLedger;
  sparePrice: number;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const spareMeso = BigInt(ledger.spares) * BigInt(sparePrice);
  return (
    <section className={`${SF_PANEL} flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <h3 className={SF_TITLE}>강화 기록</h3>
        <button
          type="button"
          aria-label="기록 초기화"
          onClick={onReset}
          className="grid size-6 place-items-center rounded-md text-(--sf-muted) outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <RotateCcw size={13} />
        </button>
      </div>
      <div className="grid grid-cols-4 text-center tabular-nums">
        {[
          ["시도", ledger.attempts],
          ["성공", ledger.successes],
          ["실패", ledger.failures],
          ["파괴", ledger.destroys],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[11px] text-(--sf-muted)">{label}</span>
            <span
              className={`text-[13px] font-semibold ${label === "파괴" && Number(value) > 0 ? "text-(--sf-danger)" : ""}`}
            >
              <RollingValue value={String(value)} />
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 rounded-xl bg-(--sf-box) px-3 py-2 text-[12px] outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="text-(--sf-muted)">총 사용 메소</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-(--sf-gold) tabular-nums">
            <RollingValue value={formatMeso(ledgerTotal(ledger, sparePrice))} />
          </span>
          <ChevronDown
            size={14}
            className={`text-(--sf-muted) transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            key="breakdown"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          >
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 text-[11px] text-(--sf-muted) tabular-nums">
              <dt>강화</dt>
              <dd className="m-0 text-right">{formatMeso(ledger.enhanceMeso)}</dd>
              <dt>복구 메소</dt>
              <dd className="m-0 text-right">{formatMeso(ledger.restoreMeso)}</dd>
              <dt>스페어 {ledger.spares}개</dt>
              <dd className="m-0 text-right">{sparePrice > 0 ? formatMeso(spareMeso) : "가격 미입력"}</dd>
            </dl>
          </m.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
