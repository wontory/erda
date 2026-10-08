import { m } from "motion/react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

import { SF_PILL } from "./theme.ts";

const pad2 = (n: number) => String(n).padStart(2, "0");

function Star({ filled, pop }: { filled: boolean; pop: boolean }) {
  return (
    <m.span
      key={filled ? "on" : "off"}
      initial={pop ? { scale: 2, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 18 }}
      className={`inline-block text-[11px] leading-none ${filled ? "text-(--sf-gold)" : "text-(--sf-text)/20"}`}
    >
      ★
    </m.span>
  );
}

export function StarTrack({
  star,
  cap,
  next,
  popFrom,
}: {
  star: number;
  cap: number;
  next: number | null;
  popFrom: number | null;
}) {
  const rows: number[][] = [];
  for (let i = 0; i < cap; i += 15) rows.push(Array.from({ length: Math.min(15, cap - i) }, (_, k) => i + k));
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`${SF_PILL} flex flex-col items-center gap-0.5 py-1.5`} aria-label={`${star}성 / 최대 ${cap}성`}>
        {rows.map((row) => (
          <div key={row[0]} className="flex gap-2">
            {Array.from({ length: Math.ceil(row.length / 5) }, (_, g) => (
              <span key={g} className="flex gap-px">
                {row.slice(g * 5, g * 5 + 5).map((i) => (
                  <Star key={i} filled={i < star} pop={popFrom !== null && i >= popFrom && i < star} />
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className={`${SF_PILL} flex items-center justify-center gap-4 text-[15px] font-extrabold tabular-nums`}>
        <span className="text-(--sf-gold)">
          ★ <RollingValue value={pad2(star)} />
        </span>
        {next === null ? (
          <span className="text-[12px] font-bold text-(--sf-muted)">최대 단계</span>
        ) : (
          <>
            <span className="text-[11px] tracking-[-0.15em] text-(--sf-text)">&gt;&gt;&gt;</span>
            <span className="text-(--sf-text)">
              ★ <RollingValue value={pad2(next)} />
            </span>
          </>
        )}
      </div>
    </div>
  );
}
