import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

import { transitionBase } from "#/lib/motion.ts";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={transitionBase}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
