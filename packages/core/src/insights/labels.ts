import { ymdParts } from "#/shared/time.ts";

import { diffDays, type HistoryArchive } from "./archive.ts";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parts(ymd: string) {
  const [y, m, d] = ymdParts(ymd);
  return { y, m, d, w: WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] };
}

export function daySectionLabel(id: string, today: string): string {
  const p = parts(id);
  const base = `${p.m}월 ${p.d}일 (${p.w})`;
  const diff = diffDays(today, id);
  if (diff === 0) return `오늘 · ${base}`;
  if (diff === 1) return `어제 · ${base}`;
  return p.y !== parts(today).y ? `${p.y}년 ${base}` : base;
}

export const timeOfDay = (dateCreate: string) => (dateCreate.length >= 16 ? dateCreate.slice(11, 16) : "");

export function chartLabel(ymd: string): string {
  const p = parts(ymd);
  return `${p.m}/${p.d}`;
}

export function historySubtitle(archive: HistoryArchive, _today: string): string | null {
  if (!archive.oldestDate || archive.days.length === 0) return null;
  return `${archive.oldestDate} ~ 오늘 · ${archive.days.length}일`;
}
