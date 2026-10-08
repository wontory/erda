import { m, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";

import { ItemArt } from "./item-art.tsx";

export type SlotPulse = { id: number; kind: "pop" | "shake" } | null;

// Wind up while charging, then pop on success or shake on a miss.
function slotMotion(charging: boolean, pulse: SlotPulse): TargetAndTransition {
  if (charging) return { scale: 0.96, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } };
  if (pulse?.kind === "pop") {
    return { scale: [0.96, 1.08, 1], transition: { type: "spring", duration: 0.45, bounce: 0.4 } };
  }
  if (pulse?.kind === "shake") return { x: [0, -5, 5, -3, 3, 0], scale: 1, transition: { duration: 0.35 } };
  return { scale: 1, x: 0 };
}

export function ItemSlot({
  destroyed,
  charging,
  pulse,
  overlay,
}: {
  destroyed: boolean;
  charging: boolean;
  pulse: SlotPulse;
  overlay?: ReactNode;
}) {
  return (
    <m.div
      key={pulse?.id ?? "still"}
      animate={slotMotion(charging, pulse)}
      className={`relative grid size-20 shrink-0 place-items-center rounded-xl border bg-foreground/4 transition-[border-color,box-shadow] duration-300 ${
        charging
          ? "border-(--sf-gold) shadow-[0_0_18px_color-mix(in_oklab,var(--sf-gold)_55%,transparent)]"
          : destroyed
            ? "border-destructive/50"
            : "border-border"
      }`}
    >
      <ItemArt destroyed={destroyed} />
      {overlay}
    </m.div>
  );
}
