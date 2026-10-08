import { formatChance, type Chances } from "@erda/core";

function Cell({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[11px] text-(--sf-muted)">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export function ChanceBox({ chances }: { chances: Chances }) {
  return (
    <div className="grid grid-cols-3 rounded-xl bg-(--sf-box) py-2" aria-label="성공 확률">
      <Cell label="성공" value={formatChance(chances.success)} />
      <Cell label={chances.destroy > 0 ? "실패(유지)" : "실패"} value={formatChance(chances.fail)} />
      <Cell
        label="파괴"
        value={formatChance(chances.destroy)}
        tone={chances.destroy > 0 ? "text-(--sf-danger)" : "text-(--sf-muted)"}
      />
    </div>
  );
}
