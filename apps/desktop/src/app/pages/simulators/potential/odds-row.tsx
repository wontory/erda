import { formatChance, type UpgradeOdds } from "@erda/core";
import { Progress } from "@erda/ui/components/ui/progress";

function Cell({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
      <span className={`truncate text-[13px] font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export function OddsRow({
  odds,
  topLabel,
  pity,
  cost,
  className = "",
}: {
  odds: UpgradeOdds | null;
  topLabel: string;
  pity: number;
  cost: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="grid grid-cols-3 gap-3">
        <Cell
          label="등급 상승"
          value={odds ? formatChance(odds.ppm) : topLabel}
          tone={odds?.guaranteed ? "text-success" : ""}
        />
        <Cell
          label="상승 보장"
          value={
            !odds || odds.ceiling === null ? "-" : odds.guaranteed ? "이번에 확정" : `${odds.ceiling - pity}회 안에`
          }
        />
        <Cell label="1회 비용" value={cost} tone="text-warning" />
      </div>
      {odds?.ceiling != null ? (
        <Progress aria-label="등급 상승 보장" value={pity} max={odds.ceiling - 1} />
      ) : (
        <div aria-hidden className="h-1" />
      )}
    </div>
  );
}
