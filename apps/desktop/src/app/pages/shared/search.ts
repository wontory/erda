import { pages, type Page } from "#/app/nav/stack.ts";
import { normalizeQuery } from "#/features/character/use-search.ts";

export function resultsPageFor(raw: string): Page | null {
  const q = raw.trim();
  if (!q) return null;
  const n = normalizeQuery(q);
  return n ? pages.results(n) : null;
}
