import { cn } from "cn";
import { m, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { transitionLayout } from "#/lib/motion.ts";

export function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    let last: number | undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.blockSize;
      if (next === undefined || next === last) return;
      if (last !== undefined && !reduce && outerRef.current) outerRef.current.style.overflow = "hidden";
      last = next;
      setHeight(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduce]);

  const clip = (on: boolean) => {
    if (outerRef.current) outerRef.current.style.overflow = on ? "hidden" : "";
  };

  return (
    <m.div
      ref={outerRef}
      initial={false}
      animate={{ height }}
      transition={reduce ? { duration: 0 } : transitionLayout}
      onAnimationStart={() => clip(true)}
      onAnimationComplete={() => clip(false)}
    >
      <div ref={innerRef} className={cn("relative flow-root", className)}>
        {children}
      </div>
    </m.div>
  );
}
