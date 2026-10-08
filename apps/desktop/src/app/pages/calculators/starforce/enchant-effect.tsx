import type { EnhanceOutcome } from "@erda/core";
import { Shield } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import type { LastResult, Phase } from "./use-starforce-session.ts";

const LABEL: Record<EnhanceOutcome, string> = {
  success: "SUCCESS",
  fail: "FAIL",
  protected: "FAIL",
  destroyed: "DESTROYED",
};

const LABEL_COLOR: Record<EnhanceOutcome, string> = {
  success: "text-(--sf-gold)",
  fail: "text-(--sf-text)",
  protected: "text-(--sf-text)",
  destroyed: "text-(--sf-danger)",
};

const SHARDS = [0, 60, 120, 180, 240, 300];

function Charging() {
  return (
    <>
      {SHARDS.map((deg) => (
        <m.span
          key={deg}
          className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-(--sf-gold) shadow-[0_0_8px_var(--sf-gold)]"
          initial={{ x: Math.cos((deg * Math.PI) / 180) * 46, y: Math.sin((deg * Math.PI) / 180) * 46, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: [0, 1, 0.2] }}
          transition={{ duration: 0.75, ease: "easeIn" }}
        />
      ))}
    </>
  );
}

function Burst({ outcome }: { outcome: EnhanceOutcome }) {
  if (outcome === "success") {
    return (
      <m.span
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,224,120,0.95),rgba(255,204,51,0)_70%)]"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    );
  }
  if (outcome === "destroyed") {
    return (
      <>
        <svg viewBox="0 0 80 80" className="absolute inset-0 size-full" aria-hidden>
          <m.path
            d="M40 4 L34 28 L46 38 L30 56 L42 76"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35 }}
          />
        </svg>
        {SHARDS.map((deg) => (
          <m.span
            key={deg}
            className="absolute top-1/2 left-1/2 size-2 bg-[#cfe0ff]"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: Math.cos((deg * Math.PI) / 180) * 60,
              y: Math.sin((deg * Math.PI) / 180) * 60,
              rotate: 180,
              opacity: 0,
            }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </>
    );
  }
  if (outcome === "protected") {
    return (
      <m.span
        className="absolute inset-0 grid place-items-center text-(--sf-title)"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.15, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6 }}
      >
        <Shield size={44} strokeWidth={2.5} />
      </m.span>
    );
  }
  return (
    <m.span
      className="absolute inset-0 bg-(--sf-text)/25"
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    />
  );
}

export function EnchantEffect({ phase, last }: { phase: Phase; last: LastResult | null }) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {phase === "charging" ? <Charging key="charging" /> : null}
        {phase === "result" && last ? (
          <span key={`result-${last.id}`} className="absolute inset-0">
            <Burst outcome={last.outcome} />
            <m.span
              className={`absolute top-1/2 left-1/2 text-[20px] font-black whitespace-nowrap italic [text-shadow:0_2px_0_#000,0_0_10px_rgba(0,0,0,0.8)] ${LABEL_COLOR[last.outcome]}`}
              initial={{ x: "-50%", y: "-50%", scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {LABEL[last.outcome]}
            </m.span>
          </span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
