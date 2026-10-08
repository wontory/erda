import { formatChance, PPM, type Chances } from "@erda/core";

function Legend({ dot, label, value, tone = "" }: { dot: string; label: string; value: string; tone?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${dot}`} />
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
      <span className={`ml-auto text-[13px] font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export function ChanceBox({ chances }: { chances: Chances }) {
  const width = (ppm: number) => `${(ppm / PPM) * 100}%`;
  return (
    <div className="flex flex-col gap-1.5" aria-label="성공 확률">
      <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-foreground/10">
        <span className="bg-success transition-[width] duration-300" style={{ width: width(chances.success) }} />
        <span className="bg-foreground/25 transition-[width] duration-300" style={{ width: width(chances.fail) }} />
        <span className="bg-destructive transition-[width] duration-300" style={{ width: width(chances.destroy) }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Legend dot="bg-success" label="성공" value={formatChance(chances.success)} />
        <Legend
          dot="bg-foreground/25"
          label={chances.destroy > 0 ? "실패(유지)" : "실패"}
          value={formatChance(chances.fail)}
        />
        <Legend
          dot="bg-destructive"
          label="파괴"
          value={formatChance(chances.destroy)}
          tone={chances.destroy > 0 ? "text-destructive" : "text-muted-foreground"}
        />
      </div>
    </div>
  );
}
