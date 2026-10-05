import { DAY_MS } from "#/shared/time.ts";

import type { NewsEntry } from "./categories.ts";
import { byDateDesc } from "./feed.ts";

const BANNER_WINDOW_MS = 14 * DAY_MS;

export const isMaintenance = (title: string) => title.includes("점검");

export function maintenanceBanner(entries: NewsEntry[], now: Date): NewsEntry | null {
  const first = entries
    .filter((e) => e.category === "notice")
    .toSorted(byDateDesc)
    .find((e) => isMaintenance(e.title));
  if (!first) return null;
  const t = Date.parse(first.date);
  if (!Number.isFinite(t) || now.getTime() - t > BANNER_WINDOW_MS) return null;
  return first;
}
