import type { EnhanceOutcome } from "@erda/core";
import { Shield } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import type { LastResult, Phase } from "./use-starforce-session.ts";

const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;

const LABEL: Record<EnhanceOutcome, string> = {
  success: "Success",
  fail: "Fail",
  protected: "Protected",
  destroyed: "Destroyed",
};

const BADGE: Record<EnhanceOutcome, string> = {
  success: "bg-(--sf-gold) text-background shadow-[0_0_18px_color-mix(in_oklab,var(--sf-gold)_55%,transparent)]",
  fail: "bg-foreground/85 text-background",
  protected: "bg-primary text-primary-foreground",
  destroyed: "bg-(--sf-danger) text-white shadow-[0_0_18px_color-mix(in_oklab,var(--sf-danger)_50%,transparent)]",
};

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];
const polar = (deg: number, r: number) => ({
  x: Math.cos((deg * Math.PI) / 180) * r,
  y: Math.sin((deg * Math.PI) / 180) * r,
});

// Particles drift into the slot while the ring tightens: the wind-up before the result.
function Charging() {
  return (
    <>
      <m.span
        className="absolute -inset-2 rounded-xl border-2 border-(--sf-gold)"
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      />
      {RAYS.map((deg, i) => (
        <m.span
          key={deg}
          className="absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full bg-(--sf-gold) shadow-[0_0_6px_var(--sf-gold)]"
          initial={{ ...polar(deg, 54), opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay: i * 0.02, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </>
  );
}

function Burst({ outcome }: { outcome: EnhanceOutcome }) {
  if (outcome === "success") {
    return (
      <>
        <m.span
          className="absolute inset-0 rounded-md border-2 border-(--sf-gold)"
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        />
        {RAYS.map((deg) => (
          <m.span
            key={deg}
            className="absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full bg-(--sf-gold)"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ ...polar(deg, 46), opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          />
        ))}
      </>
    );
  }
  if (outcome === "destroyed") {
    return (
      <>
        <svg viewBox="0 0 80 80" className="absolute inset-0 size-full" aria-hidden>
          <m.path
            d="M40 4 L34 28 L46 38 L30 56 L42 76"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-foreground"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          />
        </svg>
        {RAYS.slice(0, 6).map((deg) => (
          <m.span
            key={deg}
            className="absolute top-1/2 left-1/2 size-1.5 rounded-[1px] bg-[#cfe0ff]"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ ...polar(deg + 20, 58), rotate: 160, opacity: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: EASE_OUT_EXPO }}
          />
        ))}
      </>
    );
  }
  return (
    <m.span
      className="absolute inset-0 rounded-md bg-foreground/20"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  );
}

function ResultBadge({ outcome }: { outcome: EnhanceOutcome }) {
  return (
    <m.span
      className={`absolute -bottom-2.5 left-1/2 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap uppercase ${BADGE[outcome]}`}
      initial={{ x: "-50%", y: 6, scale: 0.92, opacity: 0, filter: "blur(4px)" }}
      animate={{ x: "-50%", y: 0, scale: 1, opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -3, transition: { duration: 0.15, ease: "easeOut" } }}
      transition={{ type: "spring", duration: 0.4, bounce: outcome === "success" ? 0.3 : 0 }}
    >
      {outcome === "protected" ? <Shield size={10} strokeWidth={3} /> : null}
      {LABEL[outcome]}
    </m.span>
  );
}

export function EnchantEffect({ phase, last }: { phase: Phase; last: LastResult | null }) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {phase === "charging" ? <Charging key="charging" /> : null}
        {phase === "result" && last ? <Burst key={`burst-${last.id}`} outcome={last.outcome} /> : null}
        {phase === "result" && last ? <ResultBadge key={`badge-${last.id}`} outcome={last.outcome} /> : null}
      </AnimatePresence>
    </span>
  );
}
