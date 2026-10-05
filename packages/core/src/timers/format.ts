import { TimeFormat } from "#/format/time.ts";
import { pad2 } from "#/shared/time.ts";

export const formatRemaining = (seconds: number) => TimeFormat.clock(seconds);

export function endClock(endMs: number): string {
  const d = new Date(endMs);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function presetDuration(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600}시간`;
  if (seconds % 60 === 0) return `${seconds / 60}분`;
  return `${seconds}초`;
}
