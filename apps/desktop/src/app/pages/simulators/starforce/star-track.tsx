import { ArrowRight, Star } from "lucide-react";
import { m } from "motion/react";

import { RollingValue } from "#/app/pages/shared/rolling-value.tsx";

import { StarCount } from "./star-count.tsx";

function StarIcon({ filled, pop }: { filled: boolean; pop: boolean }) {
  return (
    <m.span
      key={filled ? "on" : "off"}
      className="grid size-[18px] place-items-center"
      initial={pop ? { scale: 1.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 18 }}
    >
      <Star
        aria-hidden
        strokeWidth={0}
        className={`size-[18px] fill-current ${filled ? "text-(--sf-gold)" : "text-foreground/15"}`}
      />
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
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-baseline gap-2 tabular-nums">
        <StarCount className="text-[26px] leading-none font-bold text-(--sf-gold)">
          <RollingValue value={String(star)} />
        </StarCount>
        {next === null ? (
          <span className="text-[12px] font-semibold text-muted-foreground">최대 단계</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
            <ArrowRight aria-hidden className="size-3.5" />
            <StarCount>
              <RollingValue value={String(next)} />
            </StarCount>
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">최대 {cap}성</span>
      </div>
      <div className="flex flex-col gap-1" aria-label={`${star}성 / 최대 ${cap}성`}>
        {rows.map((row) => (
          <div key={row[0]} className="flex gap-2.5">
            {Array.from({ length: Math.ceil(row.length / 5) }, (_, g) => (
              <span key={g} className="flex">
                {row.slice(g * 5, g * 5 + 5).map((i) => (
                  <StarIcon key={i} filled={i < star} pop={popFrom !== null && i >= popFrom && i < star} />
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
