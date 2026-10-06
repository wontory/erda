import { keyStats, type CharacterSummary } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { cn } from "@erda/ui/lib/utils";

export function KeyMetrics({ summary, className }: { summary: CharacterSummary; className?: string }) {
  const k = keyStats(summary);
  return (
    <div className={cn(className, "grid grid-cols-3 gap-3")}>
      <Metric title="전투력" value={k.power} tint="text-primary" help={k.powerFull} />
      <Metric title="보스 데미지" value={k.boss} />
      <Metric title="방어율 무시" value={k.ignoreDefense} />
    </div>
  );
}
