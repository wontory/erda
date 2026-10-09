import { cn } from "@erda/ui/lib/utils";
import type { ComponentProps } from "react";

export function TrailingText({
  tone = "text-muted-foreground",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: string }) {
  return <span {...props} className={cn("text-[11px] font-normal tabular-nums", className, tone)} />;
}
