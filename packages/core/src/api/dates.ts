import { DAY_MS, pad2 } from "#/shared/time.ts";

export const KST_OFFSET_MS = 9 * 3600_000;

const RANKING_READY_MINUTES = 9 * 60 + 45;

export function kstNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function kstToday(now: Date = new Date()): string {
  return ymd(kstNow(now));
}

export function kstYesterday(now: Date = new Date()): string {
  return ymd(new Date(kstNow(now).getTime() - DAY_MS));
}

export function rankingBestDate(now: Date = new Date()): string {
  const k = kstNow(now);
  const minutes = k.getUTCHours() * 60 + k.getUTCMinutes();
  return minutes >= RANKING_READY_MINUTES ? ymd(k) : kstYesterday(now);
}
