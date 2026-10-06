import { cn } from "@erda/ui/lib/utils";
import type { ReactNode } from "react";

export function SubHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className, "px-2 text-[11px] font-semibold text-muted-foreground")}>{children}</div>;
}

export function SectionNote({ children }: { children: ReactNode }) {
  return <p className="px-2 text-[12px] text-muted-foreground">{children}</p>;
}
