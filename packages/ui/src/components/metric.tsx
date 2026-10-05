import { cn } from "cn";
import type { ReactNode } from "react";

export function Metric({
  title,
  value,
  tint,
  help,
}: {
  title: string;
  value: ReactNode;
  tint?: string;
  help?: string;
}) {
  return (
    <div className="min-w-0" title={help}>
      <div className={cn("truncate text-[20px] leading-tight font-semibold tabular-nums", tint)}>{value}</div>
      <div className="truncate text-[11px] text-muted-foreground">{title}</div>
    </div>
  );
}
