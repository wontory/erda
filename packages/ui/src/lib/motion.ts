import type { Transition } from "motion/react";

export const EASE_SNAPPY = [0.32, 0.72, 0, 1] as const;

export const DURATION = { fast: 0.12, base: 0.18, slow: 0.24 } as const;

export const transitionBase: Transition = { duration: DURATION.base, ease: EASE_SNAPPY };

const exitFast = { duration: DURATION.fast, ease: "easeIn" } as const;

export const fadeScale = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97, transition: exitFast },
  transition: transitionBase,
} as const;

export const listItem = {
  initial: { opacity: 0, y: -4, height: 0 },
  animate: { opacity: 1, y: 0, height: "auto" },
  exit: { opacity: 0, y: -4, height: 0, transition: transitionBase },
  transition: { duration: DURATION.slow, ease: EASE_SNAPPY },
} as const;
