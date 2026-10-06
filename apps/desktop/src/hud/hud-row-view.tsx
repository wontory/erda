import { NEWS_META, newsCategoryByTitle } from "@erda/core";
import { TimerIcon } from "@erda/ui/components/timer-icon";
import { DURATION } from "@erda/ui/lib/motion";
import { cn } from "@erda/ui/lib/utils";
import { CheckCircle2, Megaphone, Wrench } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { createElement } from "react";

import type { HudRow } from "#/features/hud/rows.ts";
import { newsIcon } from "#/features/news/icons.ts";

const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.base, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: "easeIn" } },
} as const;

type Tone = "success" | "warning" | "neutral";

const TONE_CLASSES: Record<Tone, { ring: string; wash: string }> = {
  success: { ring: "ring-success/30", wash: "bg-success/15" },
  warning: { ring: "ring-warning/30", wash: "bg-warning/15" },
  neutral: { ring: "ring-border", wash: "bg-transparent" },
};

function toneOf(row: HudRow): Tone {
  if (row.kind === "finished") return "success";
  if (row.kind === "notice" && row.maintenance) return "warning";
  return "neutral";
}

export function HudRowView({ row }: { row: HudRow }) {
  const { ring, wash } = TONE_CLASSES[toneOf(row)];
  return (
    <div
      className={cn(
        "hud-card relative isolate mx-auto h-[66px] w-[360px] overflow-hidden rounded-2xl bg-background/85 shadow-md ring-1 transition-shadow duration-200 ease-out",
        ring,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-2xl transition-colors duration-200 ease-out",
          wash,
        )}
      />
      <AnimatePresence initial={false}>
        <m.div key={row.kind} {...swap} className="absolute inset-0 flex items-center gap-3 px-4">
          <RowContent row={row} />
        </m.div>
      </AnimatePresence>
    </div>
  );
}

const ROUNDED_FONT = { fontFamily: "ui-rounded, system-ui" };

function RowContent({ row }: { row: HudRow }) {
  switch (row.kind) {
    case "timer":
      return (
        <>
          <TimerIcon name={row.icon} color={row.color} size={26} />
          <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{row.name}</div>
          <div className="text-[34px] leading-none font-semibold tabular-nums" style={ROUNDED_FONT}>
            {row.remaining}
          </div>
        </>
      );
    case "finished":
      return (
        <>
          <CheckCircle2 size={26} className="text-success" />
          <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{row.name}</div>
          <div className="text-[13px] font-semibold text-success">완료</div>
        </>
      );
    case "notice":
      return (
        <>
          <NoticeIcon category={row.category} maintenance={row.maintenance} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-muted-foreground">
              {row.maintenance ? "점검 공지" : `새 ${row.category}`}
            </div>
            <div className="line-clamp-2 text-[13px] leading-tight font-semibold">{row.title}</div>
          </div>
        </>
      );
  }
}

function NoticeIcon({ category, maintenance }: { category: string; maintenance: boolean }) {
  if (maintenance) return <Wrench size={26} className="text-warning" />;
  const c = newsCategoryByTitle(category);
  if (!c) return <Megaphone size={26} className="text-primary" />;
  return createElement(newsIcon(c), { size: 26, className: NEWS_META[c].text });
}
