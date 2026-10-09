import { cn } from "cn";
import { m } from "motion/react";
import type { ReactNode, Ref } from "react";

import { stackItem } from "#/lib/motion.ts";

export function StackItem({
  ref,
  className,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <m.div ref={ref} {...stackItem} className={cn("empty:hidden", className)}>
      {children}
    </m.div>
  );
}
