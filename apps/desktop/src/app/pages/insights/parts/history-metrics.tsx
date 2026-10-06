import { HISTORY_META, type HistoryAggregate, type HistoryKind } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";

function metricCells(kind: HistoryKind, agg: HistoryAggregate): ReadonlyArray<readonly [string, number]> {
  if (kind === "starforce") {
    return [
      ["전체", agg.total],
      ["성공", agg.counts.success],
      ["실패", agg.counts.fail],
      ["파괴", agg.counts.destroy],
    ];
  }
  return [
    ["전체", agg.total],
    ["등급업", agg.counts.upgrade],
    ["유지", agg.counts.keep],
  ];
}

export function HistoryMetrics({ kind, agg }: { kind: HistoryKind; agg: HistoryAggregate }) {
  const meta = HISTORY_META[kind];
  return (
    <Module>
      <div className={kind === "starforce" ? "grid grid-cols-4 gap-2" : "grid grid-cols-3 gap-2"}>
        {metricCells(kind, agg).map(([title, value]) => (
          <Metric key={title} title={title} value={value.toLocaleString("en-US")} />
        ))}
      </div>
      <div className="mt-2 text-[12px] text-muted-foreground">
        {meta.rateLabel}{" "}
        <span className="font-semibold text-foreground">{agg.rate === null ? "-" : `${agg.rate}%`}</span>
      </div>
    </Module>
  );
}
