import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";

import { fade } from "#/lib/motion.ts";

// Crossfades whenever `id` changes. The outgoing view is popped out of flow,
// so wrap in <AutoHeight> to glide between the two heights.
export function Swap({ id, children, className }: { id: string | number; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <m.div key={id} {...fade} className={className}>
        {children}
      </m.div>
    </AnimatePresence>
  );
}
