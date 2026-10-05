import { addDays, totalDays, type HistoryArchive } from "./archive.ts";
import type { HistoryEntry, HistoryResult } from "./history-mapping.ts";

export interface ItemUsage {
  key: string;
  part: string | null;
  target: string;
  uses: number;
  good: number;
  stack: number | null;
}

type ResultCounts = Record<HistoryResult, number>;

export interface HistoryAggregate {
  total: number;
  counts: ResultCounts;
  good: number;
  rate: number | null;
  items: ItemUsage[];
  progress: number;
  loadedDays: number;
  daily: Array<{ date: string; counts: ResultCounts }>;
}

const CHART_DAYS = 14;

const emptyCounts = (): ResultCounts => ({ success: 0, fail: 0, destroy: 0, upgrade: 0, keep: 0 });
const isGood = (e: HistoryEntry) => e.result === "success" || e.result === "upgrade";
const itemKey = (e: HistoryEntry) => `${e.part ?? ""}|${e.target}`;

function tallyItem(items: Map<string, ItemUsage>, latestByKey: Map<string, string>, e: HistoryEntry): void {
  const key = itemKey(e);
  const item = items.get(key) ?? { key, part: e.part, target: e.target, uses: 0, good: 0, stack: null };
  item.uses += 1;
  if (isGood(e)) item.good += 1;
  if (e.date >= (latestByKey.get(key) ?? "")) {
    latestByKey.set(key, e.date);
    item.stack = e.stack;
  }
  items.set(key, item);
}

function recentDaily(newestDate: string | null, perDay: ReadonlyMap<string, ResultCounts>): HistoryAggregate["daily"] {
  if (!newestDate) return [];
  return Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = addDays(newestDate, i - (CHART_DAYS - 1));
    return { date, counts: perDay.get(date) ?? emptyCounts() };
  });
}

export function aggregate(archive: HistoryArchive, today: string): HistoryAggregate {
  const counts = emptyCounts();
  const items = new Map<string, ItemUsage>();
  const latestByKey = new Map<string, string>();
  const perDay = new Map<string, ResultCounts>();
  let total = 0;
  for (const day of archive.days) {
    const dayCounts = emptyCounts();
    for (const e of day.entries) {
      total += 1;
      counts[e.result] += 1;
      dayCounts[e.result] += 1;
      tallyItem(items, latestByKey, e);
    }
    perDay.set(day.id, dayCounts);
  }
  const good = counts.success + counts.upgrade;
  const loadedDays = archive.days.length;
  return {
    total,
    counts,
    good,
    rate: total > 0 ? Math.floor((good / total) * 100) : null,
    items: [...items.values()].toSorted((a, b) => b.uses - a.uses),
    progress: archive.reachedEnd ? 1 : Math.min(1, loadedDays / totalDays(archive.kind, today)),
    loadedDays,
    daily: recentDaily(archive.newestDate, perDay),
  };
}
