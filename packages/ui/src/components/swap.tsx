import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";

import { fade } from "#/lib/motion.ts";

export function Swap({ id, children, className }: { id: string | number; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <m.div key={id} {...fade} className={className}>
        {children}
      </m.div>
    </AnimatePresence>
  );
}
