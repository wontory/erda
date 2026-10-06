import { keyStats, type CharacterSummary } from "@erda/core";
import { Module } from "@erda/ui/components/module";

import { KeyMetrics } from "./key-metrics.tsx";

export function KeyStatsModule({ summary }: { summary: CharacterSummary }) {
  const { grid } = keyStats(summary);
  return (
    <Module title="능력치">
      <KeyMetrics summary={summary} />
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
        {grid.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </Module>
  );
}
