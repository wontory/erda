import { TimeFormat } from "#/format/time.ts";
import { compareDesc } from "#/shared/compare.ts";

import type { NewsCategory, NewsEntry } from "./categories.ts";

type NewsFilter = NewsCategory | "all";

export const byDateDesc = (a: NewsEntry, b: NewsEntry) => compareDesc(a.date, b.date);

const inFilter = (e: NewsEntry, filter: NewsFilter) => filter === "all" || e.category === filter;

type Pinned = readonly (NewsEntry | null)[];

const isPinned = (e: NewsEntry, pinned: Pinned) => pinned.some((p) => p?.id === e.id);

export function feedEntries(entries: NewsEntry[], filter: NewsFilter, pinned: Pinned): NewsEntry[] {
  return entries.filter((e) => inFilter(e, filter) && !isPinned(e, pinned)).toSorted(byDateDesc);
}

export function unreadCount(entries: NewsEntry[], seen: ReadonlySet<string>, filter: NewsFilter = "all"): number {
  return entries.filter((e) => inFilter(e, filter) && !seen.has(e.id)).length;
}

export function periodCaption(e: NewsEntry): string {
  const day = TimeFormat.shortDate(e.date);
  if (!e.start && !e.end) return day;
  const start = e.start ? `${TimeFormat.shortDate(e.start)} ` : "";
  const end = e.end ? ` ${TimeFormat.shortDate(e.end)}` : "";
  return `${day} · ${start}~${end}`;
}

export function isOngoing(e: NewsEntry, now: Date): boolean {
  if (e.category === "cashshop") return e.ongoing === true;
  if (!e.start || !e.end) return false;
  const start = Date.parse(e.start);
  const end = Date.parse(e.end);
  const t = now.getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start <= t && t <= end;
}

export function latest(entries: NewsEntry[], n: number, pinned: Pinned = []): NewsEntry[] {
  return entries
    .filter((e) => !isPinned(e, pinned))
    .toSorted(byDateDesc)
    .slice(0, n);
}
