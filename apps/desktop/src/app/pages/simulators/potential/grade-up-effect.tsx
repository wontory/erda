import type { PotentialGrade } from "@erda/core";
import { m } from "motion/react";
import type { CSSProperties } from "react";

const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const WHITE = "#ffffff";
const GOLD = "#ffe08a";

function Twinkle({
  x,
  y,
  size,
  color,
  delay,
  duration = 0.5,
}: {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
  duration?: number;
}) {
  return (
    <m.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="absolute"
      style={{ left: x, top: y, marginLeft: -size / 2, marginTop: -size / 2, color }}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{ scale: [0, 1.15, 0.7, 0], opacity: [0, 1, 0.9, 0], rotate: 45 }}
      transition={{ duration, delay, ease: EASE_OUT, times: [0, 0.3, 0.7, 1] }}
    >
      <path
        d="M12 0C12.7 8.4 15.6 11.3 24 12C15.6 12.7 12.7 15.6 12 24C11.3 15.6 8.4 12.7 0 12C8.4 11.3 11.3 8.4 12 0Z"
        fill="currentColor"
      />
    </m.svg>
  );
}

const SLOT_STARS = [
  { x: "6%", y: "4%", size: 44, color: GOLD, delay: 0.4 },
  { x: "100%", y: "14%", size: 34, color: WHITE, delay: 0.46 },
  { x: "92%", y: "100%", size: 40, color: GOLD, delay: 0.54 },
  { x: "-6%", y: "86%", size: 28, color: WHITE, delay: 0.6 },
  { x: "50%", y: "-14%", size: 24, color: WHITE, delay: 0.66 },
];

export function SlotGradeUp() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]">
      <m.span
        className="absolute inset-0 rounded-[inherit] border-[3px] border-white shadow-[0_0_18px_6px_rgb(255_255_255/0.85)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 1, 1, 0] }}
        transition={{ duration: 1, times: [0, 0.25, 0.35, 0.6, 1], ease: "easeOut" }}
      />
      <m.span
        className="absolute inset-0 rounded-[inherit] bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.55, 0.2, 0] }}
        transition={{ duration: 0.9, times: [0, 0.38, 0.45, 0.65, 1], ease: "easeOut" }}
      />
      <m.span
        className="absolute top-1/2 left-1/2 size-24 rounded-full border-4 border-white shadow-[0_0_20px_4px_rgb(255_255_255/0.85),inset_0_0_16px_rgb(255_255_255/0.6)]"
        style={{ marginLeft: -48, marginTop: -48 }}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.7, 0.7, 2.6], opacity: [0, 1, 0] }}
        transition={{ duration: 1.15, times: [0, 0.35, 1], ease: EASE_OUT }}
      />
      {SLOT_STARS.map((s, i) => (
        <Twinkle key={i} {...s} duration={0.7} />
      ))}
    </span>
  );
}

const CARD_SPARKS = Array.from({ length: 30 }, (_, i) => {
  const col = (i * 37) % 100;
  const row = (i * 61) % 100;
  return {
    x: `${4 + col * 0.92}%`,
    y: `${6 + row * 0.88}%`,
    size: 8 + ((i * 7) % 13),
    color: i % 3 === 0 ? WHITE : "var(--grade-tint)",
    delay: 0.4 + ((i * 13) % 55) / 100,
  };
});

export function CardGradeUp({ grade }: { grade: PotentialGrade }) {
  return (
    <span
      aria-hidden
      style={{ "--grade-tint": `var(--grade-${grade})` } as CSSProperties}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <m.span
        className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--grade-tint)_50%,transparent),color-mix(in_oklab,var(--grade-tint)_22%,transparent))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0.8, 0] }}
        transition={{ duration: 1.2, times: [0, 0.33, 0.42, 0.65, 1], ease: "easeOut" }}
      />
      {CARD_SPARKS.map((s, i) => (
        <Twinkle key={i} {...s} />
      ))}
    </span>
  );
}
