import { KoreanNumber, type AttemptCost } from "@erda/core";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

import { SfSwitchRow } from "./sf-parts.tsx";

export function CostRow({
  cost,
  protect,
  protectable,
  onProtect,
}: {
  cost: AttemptCost;
  protect: boolean;
  protectable: boolean;
  onProtect: (on: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 rounded-md border border-(--sf-gold)/60 bg-(--sf-box) px-2.5 py-2 text-[12px]">
        <span className="font-semibold text-(--sf-muted)">사용 재화</span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <span aria-hidden className="size-3 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff2a8,#e0a400)]" />
          {cost.before !== cost.total ? (
            <s className="text-[11px] text-(--sf-muted)">{KoreanNumber.format(cost.before)}</s>
          ) : null}
          <span className="font-bold">
            <RollingValue value={KoreanNumber.format(cost.total)} />
          </span>
          <span className="text-(--sf-muted)">메소</span>
        </span>
      </div>
      <div className="mx-auto w-3/5 rounded-full bg-(--sf-pill) px-3 py-1">
        <SfSwitchRow label="파괴 방지" checked={protect && protectable} disabled={!protectable} onChange={onProtect} />
      </div>
    </div>
  );
}
