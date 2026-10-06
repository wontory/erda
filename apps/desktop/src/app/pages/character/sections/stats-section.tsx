import { TimeFormat, formatStat, groupStats, type CharacterSummary } from "@erda/core";
import { Module } from "@erda/ui/components/module";

import { KeyMetrics } from "#/app/pages/character/parts/key-metrics.tsx";

import { ValueRow } from "./value-row.tsx";

export function StatsSection({ summary }: { summary: CharacterSummary }) {
  return (
    <>
      <Module>
        <KeyMetrics summary={summary} />
      </Module>
      {groupStats(summary.stats)
        .filter((g) => g.rows.length > 0)
        .map((g) => (
          <Module key={g.title} title={g.title}>
            {g.rows.map((r) => (
              <ValueRow key={r.name} label={r.name} value={formatStat(r.name, r.value)} />
            ))}
          </Module>
        ))}
      <p className="px-2 text-[11px] text-muted-foreground">
        {TimeFormat.relative(new Date(summary.fetchedAt))}에 받은 정보예요. 넥슨 데이터는 평균 15분 뒤에 반영돼요.
      </p>
    </>
  );
}
