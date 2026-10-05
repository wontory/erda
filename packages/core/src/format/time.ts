import { pad2 } from "#/shared/time.ts";

const RELATIVE_UNITS: ReadonlyArray<readonly [seconds: number, label: string]> = [
  [365 * 86400, "년"],
  [30 * 86400, "개월"],
  [7 * 86400, "주"],
  [86400, "일"],
  [3600, "시간"],
  [60, "분"],
];

export const TimeFormat = {
  clock(seconds: number): string {
    const total = Math.max(0, Math.ceil(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
  },
  relative(date: Date, now: Date = new Date()): string {
    const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
    const isPast = diffSec < 0;
    const abs = Math.abs(diffSec);
    if (abs < 60) return isPast ? "방금 전" : "곧";
    const suffix = isPast ? "전" : "후";
    for (const [size, label] of RELATIVE_UNITS) {
      if (abs >= size) return `${Math.floor(abs / size)}${label} ${suffix}`;
    }
    return isPast ? "방금 전" : "곧";
  },
  shortDate(s: string | null | undefined): string {
    return s && s.length >= 10 ? s.slice(0, 10) : "-";
  },
};
