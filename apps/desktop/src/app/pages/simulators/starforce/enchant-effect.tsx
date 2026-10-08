import type { EnhanceOutcome } from "@erda/core";
import { Check, Flame, Shield, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { SparkCanvas, type SparkHandle } from "./spark-canvas.tsx";
import type { LastResult, Phase } from "./use-starforce-session.ts";

const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;

const RESULT: Record<EnhanceOutcome, { label: string; icon: LucideIcon; tone: string }> = {
  success: { label: "성공", icon: Check, tone: "var(--success)" },
  fail: { label: "실패", icon: X, tone: "var(--muted-foreground)" },
  protected: { label: "파괴 방지", icon: Shield, tone: "var(--primary)" },
  destroyed: { label: "파괴", icon: Flame, tone: "var(--destructive)" },
};

function Rays({ strength }: { strength: number }) {
  return (
    <m.span
      className="absolute top-1/2 left-1/2 -z-10 -mt-24 -ml-24 size-48 rounded-full mix-blend-screen"
      style={{
        background: "repeating-conic-gradient(from 0deg, rgb(255 214 110 / 0.55) 0deg 6deg, transparent 6deg 30deg)",
        maskImage: "radial-gradient(circle, black 18%, transparent 68%)",
      }}
      initial={{ opacity: 0, rotate: 0, scale: 0.85 }}
      animate={{ opacity: strength, rotate: 90, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.6, ease: EASE_OUT_EXPO },
        rotate: { duration: 6, ease: "linear" },
      }}
    />
  );
}

function Charging() {
  return (
    <m.span
      className="absolute -inset-2 rounded-[calc(var(--radius-xl)+7px)] border-2 border-(--sf-gold)"
      initial={{ scale: 1.3, opacity: 0 }}
      animate={{ scale: 1, opacity: [0, 0.9, 0.55] }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
    />
  );
}

function Burst({ outcome }: { outcome: EnhanceOutcome }) {
  if (outcome === "success") {
    return (
      <>
        <m.span
          className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgb(255_236_170/0.85),rgb(255_200_60/0.25)_45%,transparent_70%)] mix-blend-screen"
          initial={{ opacity: 1, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        />
        <m.span
          className="absolute inset-0 rounded-[calc(var(--radius-xl)-1px)] border-2 border-(--sf-gold)"
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
        />
      </>
    );
  }
  if (outcome === "destroyed") {
    return (
      <>
        <m.span
          className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgb(255_90_70/0.55),transparent_70%)]"
          initial={{ opacity: 1, scale: 0.7 }}
          animate={{ opacity: 0, scale: 1.3 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        />
        <svg viewBox="0 0 80 80" className="absolute inset-0 size-full" aria-hidden>
          <m.path
            d="M40 4 L34 28 L46 38 L30 56 L42 76 M34 28 L22 34 M46 38 L58 44"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ pathLength: { duration: 0.25, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 1.1 } }}
          />
        </svg>
      </>
    );
  }
  if (outcome === "protected") {
    return (
      <m.span
        className="absolute inset-0 rounded-[calc(var(--radius-xl)-1px)] bg-primary/20"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    );
  }
  return (
    <m.span
      className="absolute inset-0 rounded-[calc(var(--radius-xl)-1px)] bg-foreground/20"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  );
}

function ResultBadge({ outcome }: { outcome: EnhanceOutcome }) {
  const { label, icon: Icon, tone } = RESULT[outcome];
  return (
    <m.span
      className="absolute top-1/2 left-1/2 z-20 inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold whitespace-nowrap shadow-sm"
      style={{
        color: tone,
        borderColor: `color-mix(in oklab, ${tone} 35%, var(--border))`,
        background: `color-mix(in oklab, ${tone} 12%, var(--background))`,
      }}
      initial={{ x: "-50%", y: "-50%", scale: 0.9, opacity: 0 }}
      animate={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: "easeOut" } }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
    >
      <Icon className="size-3" strokeWidth={2.5} aria-hidden />
      {label}
    </m.span>
  );
}

export function EnchantEffect({ phase, last }: { phase: Phase; last: LastResult | null }) {
  const reduced = useReducedMotion() ?? false;
  const sparks = useRef<SparkHandle>(null);

  useEffect(() => {
    sparks.current?.charge(phase === "charging");
    if (phase === "result" && last) sparks.current?.burst(last.outcome);
  }, [phase, last]);

  const success = phase === "result" && last?.outcome === "success";
  return (
    <span className="pointer-events-none absolute inset-0 isolate overflow-visible">
      <AnimatePresence>
        {phase === "charging" || success ? <Rays key="rays" strength={success ? 0.9 : 0.5} /> : null}
        {phase === "charging" ? <Charging key="charging" /> : null}
        {phase === "result" && last ? <Burst key={`burst-${last.id}`} outcome={last.outcome} /> : null}
        {phase === "result" && last ? <ResultBadge key={`badge-${last.id}`} outcome={last.outcome} /> : null}
      </AnimatePresence>
      <SparkCanvas ref={sparks} disabled={reduced} />
    </span>
  );
}
