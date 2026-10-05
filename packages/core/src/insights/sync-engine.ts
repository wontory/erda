import { kstNow, kstToday } from "#/api/dates.ts";
import { nextReset } from "#/boss/reset.ts";
import { compareDesc } from "#/shared/compare.ts";
import { pad2 } from "#/shared/time.ts";

import type { HistoryAggregate } from "./aggregates.ts";
import { applyDays, emptyArchive, headDates, nextBackfillDate, totalDays, type HistoryArchive } from "./archive.ts";
import { HISTORY_KINDS, mapHistory, type HistoryEntry, type HistoryKind } from "./history-mapping.ts";

export const PAGE_LIMIT = 50;
export const SAVE_EVERY = 30;
export const PAUSE_429_MS = 900_000;
export const MAX_SLEEP_MS = 60_000;

export interface FetchedPage {
  entries: unknown[];
  nextCursor: string | null;
}

export interface SyncPorts {
  load(kind: HistoryKind): Promise<HistoryArchive>;
  save(archive: HistoryArchive): Promise<void>;
  fetchPage(kind: HistoryKind, args: { date?: string; cursor?: string }, force: boolean): Promise<FetchedPage>;
  callsToday(): Promise<number>;
  budget(): Promise<number>;
  now(): number;
  sleep(ms: number): Promise<void>;
  isRateLimited(e: unknown): boolean;
  describe(e: unknown): string;
}

export type SyncPhase = "idle" | "syncing" | "paused" | "error" | "done";

export interface KindSync {
  phase: SyncPhase;
  percent: number;
  currentDate: string | null;
  pausedUntil: number | null;
  reason: string | null;
  error: string | null;
}

export const IDLE_SYNC: KindSync = {
  phase: "idle",
  percent: 0,
  currentDate: null,
  pausedUntil: null,
  reason: null,
  error: null,
};

const BUDGET_REASON = "오늘 호출 예산을 다 썼어요";
const RATE_REASON = "호출량 초과";
const DAILY_LIMIT_REASON = "넥슨 일일 호출량을 넘은 것 같아요";

const idleAt = (percent: number): KindSync => ({ ...IDLE_SYNC, percent });

const syncingAt = (percent: number, currentDate: string): KindSync => ({
  ...IDLE_SYNC,
  phase: "syncing",
  currentDate,
  percent,
});

const pausedAt = (percent: number, pausedUntil: number, reason: string): KindSync => ({
  ...IDLE_SYNC,
  phase: "paused",
  percent,
  pausedUntil,
  reason,
});

const errorAt = (percent: number, error: string): KindSync => ({ ...IDLE_SYNC, phase: "error", percent, error });

const isFinished = (s: KindSync) => s.phase === "error" || s.phase === "done";

const isBudgetPaused = (s: KindSync) => s.phase === "paused" && s.reason === BUDGET_REASON;

function runnable(s: KindSync | undefined, now: number): boolean {
  const st = s ?? IDLE_SYNC;
  if (isFinished(st)) return false;
  return !(st.phase === "paused" && (st.pausedUntil ?? 0) > now);
}

export function pickKind(
  active: HistoryKind[],
  viewed: HistoryKind | null,
  states: ReadonlyMap<HistoryKind, KindSync>,
  now: number,
): HistoryKind | null {
  if (viewed && active.includes(viewed) && runnable(states.get(viewed), now)) return viewed;
  return HISTORY_KINDS.find((k) => active.includes(k) && runnable(states.get(k), now)) ?? null;
}

export async function fetchDay(
  ports: SyncPorts,
  kind: HistoryKind,
  date: string,
  force: boolean,
): Promise<HistoryEntry[]> {
  const out: HistoryEntry[] = [];
  const collect = (page: FetchedPage) => out.push(...page.entries.map((r) => mapHistory(kind, r)));
  let page = await ports.fetchPage(kind, { date }, force);
  collect(page);
  let pages = 1;
  while (page.nextCursor && pages < PAGE_LIMIT) {
    page = await ports.fetchPage(kind, { cursor: page.nextCursor }, force);
    collect(page);
    pages += 1;
  }
  return out;
}

function percentOf(archive: HistoryArchive, today: string): number {
  if (archive.reachedEnd) return 100;
  return Math.min(100, Math.floor((archive.days.length / totalDays(archive.kind, today)) * 100));
}

const mergeHead = (a: string[], b: string[]) => [...new Set([...a, ...b])].toSorted(compareDesc);

export class HistorySync {
  private archives = new Map<HistoryKind, HistoryArchive>();
  private states = new Map<HistoryKind, KindSync>();
  private heads = new Map<HistoryKind, string[]>();
  private unsaved = new Map<HistoryKind, number>();
  private forced = new Set<HistoryKind>();
  private loadFailed = new Set<HistoryKind>();
  private generation = new Map<HistoryKind, number>();
  private active: HistoryKind[] = [];
  private viewed: HistoryKind | null = null;
  private backoffUntil: number | null = null;
  private backoffReason = RATE_REASON;
  private running: Promise<void> | null = null;
  private dirty = false;
  private wake: (() => void) | null = null;
  private lastToday: string | null = null;
  private loading = new Map<HistoryKind, Promise<HistoryArchive>>();
  private resets = 0;

  private readonly ports: SyncPorts;
  private readonly onChange: (kind: HistoryKind) => void;

  constructor(ports: SyncPorts, onChange: (kind: HistoryKind) => void) {
    this.ports = ports;
    this.onChange = onChange;
  }

  archive(kind: HistoryKind): HistoryArchive | undefined {
    return this.archives.get(kind);
  }

  state(kind: HistoryKind): KindSync {
    return this.states.get(kind) ?? IDLE_SYNC;
  }

  get epoch(): number {
    return this.resets;
  }

  whenIdle(): Promise<void> {
    return this.running ?? Promise.resolve();
  }

  load(kind: HistoryKind): Promise<HistoryArchive> {
    const have = this.archives.get(kind);
    if (have) return Promise.resolve(have);
    const pending = this.loading.get(kind);
    if (pending) return pending;
    const epoch = this.resets;
    const p = this.ports.load(kind).then(
      (a) => {
        if (epoch !== this.resets) return a;
        this.loadFailed.delete(kind);
        this.archives.set(kind, a);
        this.loading.delete(kind);
        this.onChange(kind);
        return a;
      },
      (e) => {
        const empty = emptyArchive(kind);
        if (epoch !== this.resets) return empty;
        this.loadFailed.add(kind);
        this.archives.set(kind, empty);
        this.loading.delete(kind);
        this.setState(kind, errorAt(0, this.ports.describe(e)));
        return empty;
      },
    );
    this.loading.set(kind, p);
    return p;
  }

  reset(): void {
    for (const k of HISTORY_KINDS) this.bump(k);
    this.resets += 1;
    this.archives.clear();
    this.states.clear();
    this.heads.clear();
    this.unsaved.clear();
    this.forced.clear();
    this.loadFailed.clear();
    this.loading.clear();
    this.active = [];
    this.viewed = null;
    this.backoffUntil = null;
    this.dirty = true;
    this.wake?.();
    for (const k of HISTORY_KINDS) this.onChange(k);
  }

  nudge(): void {
    if (this.active.length > 0) this.kick();
  }

  async open(kind: HistoryKind): Promise<void> {
    const epoch = this.resets;
    const archive = await this.load(kind);
    if (!this.claimView(kind, epoch)) return;
    const st = this.state(kind);
    if (!this.active.includes(kind) || st.phase === "done") {
      this.bump(kind);
      this.activate(kind);
      this.heads.set(kind, headDates(archive, this.today()));
      if (st.phase === "done") this.setState(kind, idleAt(st.percent));
    }
    this.kick();
  }

  async refresh(kind: HistoryKind): Promise<void> {
    if (this.loadFailed.has(kind)) this.archives.delete(kind);
    const epoch = this.resets;
    const archive = await this.load(kind);
    if (!this.claimView(kind, epoch)) return;
    this.bump(kind);
    this.activate(kind);
    this.forced.add(kind);
    this.backoffUntil = null;
    this.heads.set(kind, headDates(archive, this.today()));
    this.setState(kind, idleAt(percentOf(archive, this.today())));
    this.kick();
  }

  private claimView(kind: HistoryKind, epoch: number): boolean {
    if (epoch !== this.resets) return false;
    this.viewed = kind;
    return !this.loadFailed.has(kind);
  }

  private activate(kind: HistoryKind) {
    if (!this.active.includes(kind)) this.active.push(kind);
  }

  private bump(kind: HistoryKind) {
    this.generation.set(kind, this.generationOf(kind) + 1);
  }

  private generationOf(kind: HistoryKind): number {
    return this.generation.get(kind) ?? 0;
  }

  private markUnsaved(kind: HistoryKind, count = 1) {
    this.unsaved.set(kind, (this.unsaved.get(kind) ?? 0) + count);
  }

  private today() {
    return kstToday(new Date(this.ports.now()));
  }

  private setState(kind: HistoryKind, next: KindSync) {
    this.states.set(kind, next);
    this.onChange(kind);
  }

  private kick() {
    this.dirty = true;
    this.wake?.();
    if (!this.running) {
      this.running = this.loop().catch((e) => {
        console.error("history sync loop failed", e);
        this.running = null;
      });
    }
  }

  private async loop() {
    for (;;) {
      this.dirty = false;
      const worked = await this.step();
      if (!worked && !this.dirty) {
        this.running = null;
        return;
      }
    }
  }

  private async flush(kind: HistoryKind) {
    const archive = this.archives.get(kind);
    const pending = this.unsaved.get(kind) ?? 0;
    if (!archive || !pending || this.loadFailed.has(kind)) return;
    this.unsaved.set(kind, 0);
    const epoch = this.resets;
    try {
      await this.ports.save(archive);
    } catch (e) {
      if (epoch === this.resets) this.markUnsaved(kind, pending);
      throw e;
    }
  }

  private rollover(today: string) {
    if (this.lastToday !== null && this.lastToday !== today) {
      for (const kind of this.active) {
        const archive = this.archives.get(kind);
        if (!archive) continue;
        this.heads.set(kind, mergeHead(this.heads.get(kind) ?? [], headDates(archive, today)));
        const st = this.state(kind);
        if (st.phase === "done") this.setState(kind, idleAt(st.percent));
      }
    }
    this.lastToday = today;
  }

  private async recheckBudget() {
    const waiting = this.active.filter((k) => isBudgetPaused(this.state(k)));
    if (waiting.length === 0) return;
    let calls: number;
    let budget: number;
    try {
      calls = await this.ports.callsToday();
      budget = await this.ports.budget();
    } catch {
      return;
    }
    if (calls >= budget) return;
    for (const k of waiting) {
      const st = this.state(k);
      if (isBudgetPaused(st)) this.setState(k, idleAt(st.percent));
    }
  }

  private pauseForRateLimit(kind: HistoryKind, pct: number) {
    const now = this.ports.now();
    const repeated = this.backoffUntil !== null && now >= this.backoffUntil;
    const until = repeated ? nextReset("daily", new Date(now)).getTime() : now + PAUSE_429_MS;
    const reason = repeated ? DAILY_LIMIT_REASON : RATE_REASON;
    this.backoffUntil = until;
    this.backoffReason = reason;
    const keepsOwnState = (st: KindSync) => isFinished(st) || (st.phase === "paused" && (st.pausedUntil ?? 0) >= until);
    for (const k of this.active) {
      const st = this.state(k);
      if (k !== kind && keepsOwnState(st)) continue;
      this.setState(k, pausedAt(k === kind ? pct : st.percent, until, reason));
    }
  }

  private async waitForResume(now: number): Promise<boolean> {
    const waits = this.active
      .map((k) => this.state(k))
      .filter((s) => s.phase === "paused" && s.pausedUntil !== null)
      .map((s) => (s.pausedUntil as number) - now);
    if (waits.length === 0) return false;
    const woken = new Promise<void>((resolve) => {
      this.wake = resolve;
    });
    try {
      await Promise.race([this.ports.sleep(Math.min(MAX_SLEEP_MS, Math.max(0, Math.min(...waits)))), woken]);
    } finally {
      this.wake = null;
    }
    return true;
  }

  private async step(): Promise<boolean> {
    await this.recheckBudget();
    const now = this.ports.now();
    this.rollover(kstToday(new Date(now)));
    const kind = pickKind(this.active, this.viewed, this.states, now);
    if (!kind) return this.waitForResume(now);
    if (this.backoffUntil !== null && now < this.backoffUntil) {
      this.setState(kind, pausedAt(this.state(kind).percent, this.backoffUntil, this.backoffReason));
      return true;
    }
    const gen = this.generationOf(kind);
    try {
      await this.stepKind(kind, now, gen);
    } catch (e) {
      if (this.generationOf(kind) !== gen) return true;
      const archive = this.archives.get(kind);
      const pct = archive ? percentOf(archive, this.today()) : 0;
      this.setState(kind, errorAt(pct, this.ports.describe(e)));
    }
    return true;
  }

  private async stepKind(kind: HistoryKind, now: number, gen: number) {
    const stale = () => this.generationOf(kind) !== gen;
    const today = kstToday(new Date(now));
    const archive = this.archives.get(kind) ?? emptyArchive(kind);
    const head = this.heads.get(kind) ?? [];
    const inHead = head.length > 0;
    const date = inHead ? head[0] : nextBackfillDate(archive, kind, today);
    if (!date) return this.complete(kind, archive, stale);
    const calls = await this.ports.callsToday();
    const budget = await this.ports.budget();
    if (stale()) return;
    if (calls >= budget) return this.pauseForBudget(kind, percentOf(archive, today), now, stale);
    this.setState(kind, syncingAt(percentOf(archive, today), date));
    let entries: HistoryEntry[];
    try {
      entries = await fetchDay(this.ports, kind, date, inHead && this.forced.has(kind));
    } catch (e) {
      if (stale()) return;
      return this.failFetch(kind, archive, today, e, stale);
    }
    if (stale()) return;
    this.backoffUntil = null;
    const next = applyDays(this.archives.get(kind) ?? archive, [{ id: date, entries }], this.ports.now());
    this.archives.set(kind, next);
    this.markUnsaved(kind);
    if (inHead && this.dropFromHead(kind, head, date)) {
      this.forced.delete(kind);
      await this.flush(kind);
      if (stale()) return;
    }
    if ((this.unsaved.get(kind) ?? 0) >= SAVE_EVERY) {
      await this.flush(kind);
      if (stale()) return;
    }
    this.setState(kind, syncingAt(percentOf(next, today), date));
  }

  private dropFromHead(kind: HistoryKind, fallback: string[], date: string): boolean {
    const head = this.heads.get(kind) ?? fallback;
    const at = head.indexOf(date);
    if (at >= 0) head.splice(at, 1);
    return head.length === 0;
  }

  private async complete(kind: HistoryKind, archive: HistoryArchive, stale: () => boolean) {
    this.archives.set(kind, { ...archive, reachedEnd: true });
    this.markUnsaved(kind);
    await this.flush(kind);
    if (stale()) return;
    this.setState(kind, { ...IDLE_SYNC, phase: "done", percent: 100 });
  }

  private async pauseForBudget(kind: HistoryKind, pct: number, now: number, stale: () => boolean) {
    await this.flush(kind);
    if (stale()) return;
    this.setState(kind, pausedAt(pct, nextReset("daily", new Date(now)).getTime(), BUDGET_REASON));
  }

  private async failFetch(kind: HistoryKind, archive: HistoryArchive, today: string, e: unknown, stale: () => boolean) {
    await this.flush(kind);
    if (stale()) return;
    const pct = percentOf(this.archives.get(kind) ?? archive, today);
    if (this.ports.isRateLimited(e)) this.pauseForRateLimit(kind, pct);
    else this.setState(kind, errorAt(pct, this.ports.describe(e)));
  }
}

function hhmm(ms: number): string {
  const k = kstNow(new Date(ms));
  return `${pad2(k.getUTCHours())}:${pad2(k.getUTCMinutes())}`;
}

export function statusLine(state: KindSync, now: number): string | null {
  switch (state.phase) {
    case "paused": {
      if (state.pausedUntil === null) return state.reason;
      const tomorrow = kstToday(new Date(state.pausedUntil)) > kstToday(new Date(now));
      return `${state.reason} · ${tomorrow ? "내일 " : ""}${hhmm(state.pausedUntil)} 이후 이어서 받아요`;
    }
    case "syncing":
      return `${state.currentDate} 받는 중 · ${state.percent}%`;
    case "error":
      return state.error;
    case "done":
      return "조회 가능한 2년치를 모두 받아 뒀어요";
    case "idle":
      return null;
  }
}

export function rootSummary(agg: Pick<HistoryAggregate, "total" | "progress"> | null, state: KindSync): string {
  if (state.phase === "syncing") return `동기화 중 ${state.percent}%`;
  if (!agg) return "받은 기록 없음";
  const base = agg.progress >= 1 ? `${agg.total}건` : `${agg.total}건 · ${Math.floor(agg.progress * 100)}%`;
  if (state.phase === "paused") return `${base} · 대기 중`;
  if (state.phase === "error") return `${base} · 멈춤`;
  return base;
}
