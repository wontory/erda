import { m } from "motion/react";
import type { ReactNode } from "react";

import { SF_PILL } from "./theme.ts";

const PARTICLES = [
  { left: "14%", top: "38%", delay: 0 },
  { left: "22%", top: "64%", delay: 0.8 },
  { left: "30%", top: "24%", delay: 1.6 },
  { left: "72%", top: "30%", delay: 0.4 },
  { left: "80%", top: "58%", delay: 1.2 },
  { left: "88%", top: "42%", delay: 2 },
];

function ItemGlyph({ destroyed }: { destroyed: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={`size-12 ${destroyed ? "opacity-35 grayscale" : ""}`} aria-hidden>
      <path d="M24 5 L33 18 L29 40 L19 40 L15 18 Z" fill="#8fb7ff" stroke="#dbe8ff" strokeWidth="2" />
      <path d="M24 9 L29 18 L24 36 L19 18 Z" fill="#c7dbff" />
      <rect x="17" y="38" width="14" height="5" rx="2" fill="#ffcc33" />
    </svg>
  );
}

export function ItemPanel({
  level,
  destroyed,
  charging,
  shakeKey,
  overlay,
  onEditItem,
}: {
  level: number;
  destroyed: boolean;
  charging: boolean;
  shakeKey: number | null;
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
        key={shakeKey ?? "still"}
        animate={shakeKey === null ? undefined : { x: [0, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.35 }}
        className={`relative grid size-20 place-items-center rounded-md border-2 border-dashed bg-(--sf-box) transition-[border-color,box-shadow] duration-300 ${
          charging
            ? "border-(--sf-gold) shadow-[0_0_18px_color-mix(in_oklab,var(--sf-gold)_65%,transparent)]"
            : "border-(--sf-text)/40"
        }`}
      >
        <ItemGlyph destroyed={destroyed} />
        {overlay}
      </m.div>
      <button
        type="button"
        onClick={onEditItem}
        className={`${SF_PILL} w-3/4 text-[13px] font-semibold outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50`}
      >
        {destroyed ? `Lv.${level} 장비의 흔적` : `Lv.${level} 장비`}
      </button>
    </div>
  );
}
