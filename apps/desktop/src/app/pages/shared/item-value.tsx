import { ItemActions } from "@erda/ui/components/ui/item";
import { cn } from "@erda/ui/lib/utils";
import type { ReactNode } from "react";

export function ItemValue({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ItemActions className="min-w-0 shrink text-muted-foreground">
      <span className={cn("truncate tabular-nums", className)}>{children}</span>
    </ItemActions>
  );
}
