import { z } from "zod";

import { DEFAULT_SELECTED, bossById, bossesOf, type BossCycle, type BossEntry } from "./catalog.ts";
import { cycleStart } from "./reset.ts";

const MIN_PARTY = 1;
const MAX_PARTY = 6;

const tolerantRecord = <T>(value: z.ZodType<T>) =>
  z.preprocess(
    (raw) => {
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
      return Object.fromEntries(Object.entries(raw).filter(([, v]) => value.safeParse(v).success));
    },
    z.record(z.string(), value),
  );

export const bossStateSchema = z.object({
  selectedIDs: z.array(z.string()).catch(() => [...DEFAULT_SELECTED]),
  clearDates: tolerantRecord(z.string()),
  partySizes: tolerantRecord(z.number().int().min(MIN_PARTY).max(MAX_PARTY)),
  priceOverrides: tolerantRecord(z.number().int().positive()),
});
export type BossState = z.infer<typeof bossStateSchema>;

export const DEFAULT_BOSS_STATE: BossState = {
  selectedIDs: [...DEFAULT_SELECTED],
  clearDates: {},
  partySizes: {},
  priceOverrides: {},
};

export interface BossRow {
  key: string;
  catalogId: string | null;
  name: string;
  difficulty: string;
  cycle: BossCycle;
  party: number;
  revenue: number;
  cleared: boolean;
  inCatalog: boolean;
  registered: boolean;
  order: number;
}

export interface BossSummary {
  clearRevenue: number;
  expectedRevenue: number;
  cleared: number;
  total: number;
}

function withEntry<T>(record: Record<string, T>, id: string, value: T | null): Record<string, T> {
  const next = { ...record };
  if (value === null) delete next[id];
  else next[id] = value;
  return next;
}

export const partyOf = (s: BossState, id: string): number => s.partySizes[id] ?? MIN_PARTY;
export const priceOf = (s: BossState, e: BossEntry): number => s.priceOverrides[e.id] ?? e.price;
export const revenueOf = (s: BossState, e: BossEntry): number => Math.floor(priceOf(s, e) / partyOf(s, e.id));

export function isCleared(s: BossState, e: BossEntry, now: Date): boolean {
  const at = s.clearDates[e.id];
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && t >= cycleStart(e.cycle, now).getTime();
}

export const toggleSelected = (s: BossState, id: string): BossState => ({
  ...s,
  selectedIDs: s.selectedIDs.includes(id) ? s.selectedIDs.filter((x) => x !== id) : [...s.selectedIDs, id],
});

export function toggleClear(s: BossState, id: string, now: Date): BossState {
  const e = bossById(id);
  if (!e) return s;
  const clearedAt = isCleared(s, e, now) ? null : now.toISOString();
  return { ...s, clearDates: withEntry(s.clearDates, id, clearedAt) };
}

export function setParty(s: BossState, id: string, n: number): BossState {
  const size = Math.min(MAX_PARTY, Math.max(MIN_PARTY, Math.round(Number.isFinite(n) ? n : MIN_PARTY)));
  return { ...s, partySizes: withEntry(s.partySizes, id, size === MIN_PARTY ? null : size) };
}

export function setPrice(s: BossState, id: string, n: number): BossState {
  const e = bossById(id);
  if (!e) return s;
  const price = Number.isFinite(n) ? Math.round(n) : 0;
  const override = price <= 0 || price === e.price ? null : price;
  return { ...s, priceOverrides: withEntry(s.priceOverrides, id, override) };
}

export function manualRows(s: BossState, cycle: BossCycle, now: Date): BossRow[] {
  return bossesOf(cycle)
    .filter((e) => s.selectedIDs.includes(e.id))
    .map((e, i) => ({
      key: e.id,
      catalogId: e.id,
      name: e.name,
      difficulty: e.difficulty,
      cycle,
      party: partyOf(s, e.id),
      revenue: revenueOf(s, e),
      cleared: isCleared(s, e, now),
      inCatalog: true,
      registered: true,
      order: i,
    }));
}

export function summarize(rows: BossRow[]): BossSummary {
  let clearRevenue = 0;
  let expectedRevenue = 0;
  let cleared = 0;
  for (const r of rows) {
    expectedRevenue += r.revenue;
    if (r.cleared) {
      cleared += 1;
      clearRevenue += r.revenue;
    }
  }
  return { clearRevenue, expectedRevenue, cleared, total: rows.length };
}
