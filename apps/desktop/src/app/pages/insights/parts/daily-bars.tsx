import { chartLabel, type HistoryAggregate, type HistoryKind, type HistoryResult } from "@erda/core";
import { Module } from "@erda/ui/components/module";

type BarGroup = [HistoryResult[], string];

const STAR: BarGroup[] = [
  [["success"], "bg-green-500"],
  [["fail", "keep", "upgrade"], "bg-orange-400"],
  [["destroy"], "bg-red-500"],
];
const OTHER: BarGroup[] = [
  [["upgrade", "success"], "bg-green-500"],
  [["keep", "fail", "destroy"], "bg-muted-foreground/40"],
];

const GROW_MS = 160;
const STAGGER_BUDGET_MS = 90;

export function DailyBars({ kind, agg }: { kind: HistoryKind; agg: HistoryAggregate }) {
  if (agg.daily.length === 0) return null;
  const groups = kind === "starforce" ? STAR : OTHER;
  const totals = agg.daily.map((d) => Object.values(d.counts).reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...totals);
  const stagger = agg.daily.length > 1 ? Math.min(15, STAGGER_BUDGET_MS / (agg.daily.length - 1)) : 0;
  const label = `최근 ${agg.daily.length}일: ${agg.daily.map((d, i) => `${chartLabel(d.date)} ${totals[i]}건`).join(", ")}`;
  return (
    <Module title="최근 14일">
      <span className="sr-only">{label}</span>
      <div className="flex h-24 items-end gap-1" aria-hidden>
        {agg.daily.map((d, i) => (
          <div key={d.date} className="flex h-full flex-1 items-end" title={`${d.date} · ${totals[i]}건`}>
            <div
              className="flex h-full w-full origin-bottom flex-col-reverse transition-[scale] ease-snappy motion-reduce:transition-none starting:[scale:1_0]"
              style={{
                scale: `1 ${totals[i] / max}`,
                transitionDuration: `${GROW_MS}ms`,
                transitionDelay: `${Math.round(i * stagger)}ms`,
              }}
            >
              {groups.map(([results, color]) => {
                const n = results.reduce((s, r) => s + d.counts[r], 0);
                return n > 0 ? (
                  <div
                    key={color}
                    className={`${color} w-full first:rounded-b-sm last:rounded-t-sm`}
                    style={{ height: `${(n / totals[i]) * 100}%` }}
                  />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground" aria-hidden>
        <span>{chartLabel(agg.daily[0].date)}</span>
        <span>{chartLabel(agg.daily[agg.daily.length - 1].date)}</span>
      </div>
    </Module>
  );
}
