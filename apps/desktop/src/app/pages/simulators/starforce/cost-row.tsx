import { KoreanNumber, type AttemptCost } from "@erda/core";
import { Switch } from "@erda/ui/components/ui/switch";
import { useId } from "react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

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
  const id = useId();
  return (
    <div className="flex items-center gap-3 rounded-lg bg-foreground/4 px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">1회 비용</div>
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-[15px] font-semibold">
            <RollingValue value={KoreanNumber.format(cost.total)} />
          </span>
          <span className="text-[11px] text-muted-foreground">메소</span>
          {cost.before !== cost.total ? (
            <s className="truncate text-[11px] text-muted-foreground">{KoreanNumber.format(cost.before)}</s>
          ) : null}
        </div>
      </div>
      <label htmlFor={id} className={`flex shrink-0 items-center gap-2 text-[12px] ${protectable ? "" : "opacity-45"}`}>
        파괴 방지
        <Switch
          id={id}
          size="sm"
          checked={protect && protectable}
          disabled={!protectable}
          onCheckedChange={(on) => onProtect(on)}
        />
      </label>
    </div>
  );
}
