import { POTENTIAL_GRADE_LABELS, lineGrade, type PotentialGrade, type PotentialRoll } from "@erda/core";
import { cn } from "@erda/ui/lib/utils";
import { m } from "motion/react";
import type { ReactNode } from "react";

import { CardGradeUp } from "./grade-up-effect.tsx";
import { GRADE_BORDER, GRADE_DOT, GRADE_HEADER, GRADE_TEXT } from "./styles.ts";

export function GradeLabel({ grade, className }: { grade: PotentialGrade; className?: string }) {
  return (
    <span className={cn("text-[12px] font-semibold", GRADE_TEXT[grade], className)}>
      {POTENTIAL_GRADE_LABELS[grade]}
    </span>
  );
}

export function RollCard({
  title,
  roll,
  revealId,
  animate,
  action,
  gradeUp,
}: {
  title: string;
  roll: PotentialRoll | null;
  revealId?: number;
  animate?: boolean;
  action?: ReactNode;
  gradeUp?: boolean;
}) {
  return (
    <m.div
      key={revealId ?? "still"}
      initial={animate ? { opacity: 0.4, scale: 0.98 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
      className={cn(
        "relative flex min-w-0 flex-col gap-1.5 rounded-xl border bg-foreground/3 px-2.5 py-2 transition-[border-color,box-shadow] duration-300",
        roll ? GRADE_BORDER[roll.grade] : "border-border",
      )}
    >
      <div
        className={cn(
          "-mx-2.5 -mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-t-[inherit] px-2.5 pt-2 pb-1.5",
          roll && GRADE_HEADER[roll.grade],
        )}
      >
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">{title}</span>
        {roll ? <GradeLabel grade={roll.grade} /> : null}
      </div>
      {roll ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[12px] leading-snug text-foreground">
          {roll.lines.length === 0 ? <li className="text-muted-foreground">옵션 없음</li> : null}
          {roll.lines.map((line, i) => {
            const grade = lineGrade(roll.grade, line);
            return (
              <m.li
                key={`${i}-${line.text}`}
                initial={animate ? { opacity: 0, y: 3 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: animate ? 0.06 * i : 0, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-start gap-1.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-[0.4em] size-1.5 shrink-0 rounded-full",
                    grade ? GRADE_DOT[grade] : "bg-foreground/25",
                  )}
                />
                <span className="min-w-0 break-keep">{line.text}</span>
                {grade && grade !== roll.grade ? (
                  <span className="sr-only">({POTENTIAL_GRADE_LABELS[grade]})</span>
                ) : null}
              </m.li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 flex flex-1 items-center text-[12px] text-muted-foreground">재설정하면 결과가 여기 나와요.</p>
      )}
      {action ? <div className="mt-auto pt-1">{action}</div> : null}
      {gradeUp && roll ? <CardGradeUp grade={roll.grade} /> : null}
    </m.div>
  );
}
