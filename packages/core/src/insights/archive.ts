import { z } from "zod";

import { compareDesc } from "#/shared/compare.ts";
import { DAY_MS, ymdParts } from "#/shared/time.ts";

import { HISTORY_KINDS, HISTORY_META, type HistoryEntry, type HistoryKind } from "./history-mapping.ts";

export interface HistoryDay {
  id: string;
  entries: HistoryEntry[];
}

export interface HistoryArchive {
  kind: HistoryKind;
  days: HistoryDay[];
  newestDate: string | null;
  oldestDate: string | null;
  reachedEnd: boolean;
  fetchedAt: number | null;
  seq: number;
}

const HISTORY_WINDOW_DAYS = 730;

export const emptyArchive = (kind: HistoryKind): HistoryArchive => ({
  kind,
  days: [],
  newestDate: null,
  oldestDate: null,
  reachedEnd: false,
  fetchedAt: null,
  seq: 0,
});

const entrySchema = z.object({
  id: z.string(),
  date: z.string(),
  character: z.string(),
  target: z.string(),
  part: z.string().nullable(),
  result: z.enum(["success", "fail", "destroy", "upgrade", "keep"]),
  headline: z.string(),
  details: z.array(z.string()),
  flags: z.array(z.string()),
  stack: z.number().nullable(),
});

const daySchema = z.object({ id: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), entries: z.array(entrySchema) });

const archiveShellSchema = z.object({
  kind: z.enum(HISTORY_KINDS),
  days: z.array(z.unknown()),
  reachedEnd: z.boolean(),
  fetchedAt: z.number().nullable(),
  seq: z.number(),
});

function sortedDays(days: HistoryDay[]): Pick<HistoryArchive, "days" | "newestDate" | "oldestDate"> {
  const sorted = days.toSorted((a, b) => compareDesc(a.id, b.id));
  return {
    days: sorted,
    newestDate: sorted[0]?.id ?? null,
    oldestDate: sorted[sorted.length - 1]?.id ?? null,
  };
}

export function parseArchive(raw: unknown, kind: HistoryKind): HistoryArchive | null {
  const shell = archiveShellSchema.safeParse(raw);
  if (!shell.success || shell.data.kind !== kind) return null;
  const days: HistoryDay[] = [];
  for (const d of shell.data.days) {
    const day = daySchema.safeParse(d);
    if (day.success) days.push(day.data);
  }
  const dropped = days.length !== shell.data.days.length;
  return {
    kind,
    ...sortedDays(days),
    reachedEnd: shell.data.reachedEnd && !dropped,
    fetchedAt: shell.data.fetchedAt,
    seq: shell.data.seq,
  };
}

function toUtc(ymd: string): number {
  const [y, m, d] = ymdParts(ymd);
  return Date.UTC(y, m - 1, d);
}

export const addDays = (ymd: string, n: number): string => new Date(toUtc(ymd) + n * DAY_MS).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string): number => Math.round((toUtc(a) - toUtc(b)) / DAY_MS);

export function earliestDate(kind: HistoryKind, today: string): string {
  const windowStart = addDays(today, -HISTORY_WINDOW_DAYS);
  const floor = HISTORY_META[kind].floor;
  return floor && floor > windowStart ? floor : windowStart;
}

export const totalDays = (kind: HistoryKind, today: string): number => diffDays(today, earliestDate(kind, today)) + 1;

export function headDates(archive: HistoryArchive, today: string): string[] {
  if (!archive.newestDate || !archive.oldestDate || archive.newestDate > today) return [today];
  const have = new Set(archive.days.map((d) => d.id));
  const windowStart = addDays(today, -HISTORY_WINDOW_DAYS);
  const lowest = archive.oldestDate > windowStart ? archive.oldestDate : windowStart;
  const out: string[] = [];
  for (let d = today; d >= lowest; d = addDays(d, -1)) {
    if (d === today || d === archive.newestDate || !have.has(d)) out.push(d);
  }
  return out;
}

export function nextBackfillDate(archive: HistoryArchive, kind: HistoryKind, today: string): string | null {
  if (archive.reachedEnd) return null;
  const candidate = archive.oldestDate ? addDays(archive.oldestDate, -1) : today;
  return candidate < earliestDate(kind, today) ? null : candidate;
}

export function applyDays(archive: HistoryArchive, days: HistoryDay[], now: number): HistoryArchive {
  const byId = new Map(archive.days.map((d) => [d.id, d]));
  for (const d of days) byId.set(d.id, d);
  return {
    ...archive,
    ...sortedDays([...byId.values()]),
    fetchedAt: now,
    seq: archive.seq + 1,
  };
}
