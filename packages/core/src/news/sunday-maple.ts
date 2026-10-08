import type { NewsEntry } from "./categories.ts";
import { byDateDesc } from "./feed.ts";

export const isSundayMaple = (title: string) => title.replace(/\s/g, "").includes("썬데이메이플");

const hasEnded = (e: NewsEntry, now: Date) => {
  const end = e.end ? Date.parse(e.end) : Number.NaN;
  return Number.isFinite(end) && end < now.getTime();
};

export function sundayMaple(entries: NewsEntry[], now: Date): NewsEntry | null {
  return (
    entries
      .filter((e) => e.category === "event" && isSundayMaple(e.title) && !hasEnded(e, now))
      .toSorted(byDateDesc)[0] ?? null
  );
}
