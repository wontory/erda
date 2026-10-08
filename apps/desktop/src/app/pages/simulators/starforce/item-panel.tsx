import { m, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";

import { ItemArt } from "./item-art.tsx";
import { SF_PILL } from "./theme.ts";

export type SlotPulse = { id: number; kind: "pop" | "shake" } | null;

const PARTICLES = [
  { left: "14%", top: "38%", delay: 0 },
  { left: "22%", top: "64%", delay: 0.8 },
  { left: "30%", top: "24%", delay: 1.6 },
  { left: "72%", top: "30%", delay: 0.4 },
  { left: "80%", top: "58%", delay: 1.2 },
  { left: "88%", top: "42%", delay: 2 },
];

// Wind up while charging, then pop on success or shake on a miss.
function slotMotion(charging: boolean, pulse: SlotPulse): TargetAndTransition {
  if (charging) return { scale: 0.96, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } };
  if (pulse?.kind === "pop") {
    return { scale: [0.96, 1.08, 1], transition: { type: "spring", duration: 0.45, bounce: 0.4 } };
  }
  if (pulse?.kind === "shake") return { x: [0, -5, 5, -3, 3, 0], scale: 1, transition: { duration: 0.35 } };
  return { scale: 1, x: 0 };
}

export function ItemPanel({
  level,
  destroyed,
  charging,
  pulse,
  overlay,
  onEditItem,
}: {
  level: number;
  destroyed: boolean;
  charging: boolean;
  pulse: SlotPulse;
  overlay?: ReactNode;
  onEditItem: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center gap-2.5 rounded-xl bg-(--sf-box) px-3 pt-4 pb-3">
      {PARTICLES.map((p) => (
        <m.span
          key={`${p.left}-${p.top}`}
          aria-hidden
          className="absolute size-1 rounded-full bg-(--sf-gold) shadow-[0_0_6px_var(--sf-gold)]"
          style={{ left: p.left, top: p.top }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -6, 0] }}
          transition={{ duration: 2.4, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <m.div
        key={pulse?.id ?? "still"}
        animate={slotMotion(charging, pulse)}
        className={`relative grid size-20 place-items-center rounded-md border-2 border-dashed bg-(--sf-box) transition-[border-color,box-shadow] duration-300 ${
          charging
            ? "border-(--sf-gold) shadow-[0_0_18px_color-mix(in_oklab,var(--sf-gold)_65%,transparent)]"
            : "border-(--sf-text)/40"
        }`}
      >
        <ItemArt destroyed={destroyed} />
        {overlay}
      </m.div>
      <button
        type="button"
        onClick={onEditItem}
        className={`${SF_PILL} w-3/4 text-[13px] font-semibold transition-[background-color,scale] duration-150 ease-out outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]`}
      >
        {destroyed ? `Lv.${level} 장비의 흔적` : `Lv.${level} 장비`}
      </button>
    </div>
  );
}
