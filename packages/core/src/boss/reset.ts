import { KST_OFFSET_MS, kstNow } from "#/api/dates.ts";
import { DAY_MS } from "#/shared/time.ts";

import type { BossCycle } from "./catalog.ts";

const THURSDAY = 4;

const kstMidnight = (y: number, m: number, d: number) => Date.UTC(y, m, d) - KST_OFFSET_MS;

export function cycleStart(cycle: BossCycle, now: Date = new Date()): Date {
  const k = kstNow(now);
  const y = k.getUTCFullYear();
  const m = k.getUTCMonth();
  const d = k.getUTCDate();
  switch (cycle) {
    case "daily":
      return new Date(kstMidnight(y, m, d));
    case "weekly": {
      const daysSinceThursday = (k.getUTCDay() - THURSDAY + 7) % 7;
      return new Date(kstMidnight(y, m, d - daysSinceThursday));
    }
    case "monthly":
      return new Date(kstMidnight(y, m, 1));
  }
}

export function nextReset(cycle: BossCycle, now: Date = new Date()): Date {
  const start = cycleStart(cycle, now);
  switch (cycle) {
    case "daily":
      return new Date(start.getTime() + DAY_MS);
    case "weekly":
      return new Date(start.getTime() + 7 * DAY_MS);
    case "monthly": {
      const k = kstNow(start);
      return new Date(kstMidnight(k.getUTCFullYear(), k.getUTCMonth() + 1, 1));
    }
  }
}
