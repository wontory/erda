import { describeError } from "@erda/api/errors";
import {
  homeworkOf,
  manualRows,
  schedulerRows,
  summarize,
  weeklyBossLimit,
  type BossCycle,
  type BossRow,
  type BossState,
  type BossSummary,
  type HomeworkItem,
  type SchedulerSnapshot,
} from "@erda/core";

type BossMode = "manual" | "scheduler";
export type BossStatus = "ready" | "loading" | "error" | "empty";

export interface BossView {
  mode: BossMode;
  status: BossStatus;
  errorMessage: string | null;
  staleError: string | null;
  rows: BossRow[];
  unregistered: BossRow[];
  homework: HomeworkItem[];
  summary: BossSummary;
  weeklyLimit: { count: number; limit: number } | null;
}

type BossViewInput = {
  cycle: BossCycle;
  mode: BossMode;
  state: BossState;
  stateLoaded: boolean;
  now: Date;
  snapshot: SchedulerSnapshot | undefined;
  loading: boolean;
  error: unknown;
};

const EMPTY_SUMMARY: BossSummary = { clearRevenue: 0, expectedRevenue: 0, cleared: 0, total: 0 };

const hasSchedulerContent = (snapshot: SchedulerSnapshot) =>
  [snapshot.boss_contents, snapshot.daily_contents, snapshot.weekly_contents].some((list) => (list?.length ?? 0) > 0);

export function buildBossView({ cycle, mode, state, stateLoaded, now, snapshot, error }: BossViewInput): BossView {
  const base = {
    mode,
    errorMessage: null,
    staleError: null,
    rows: [],
    unregistered: [],
    homework: [],
    summary: EMPTY_SUMMARY,
    weeklyLimit: null,
  };
  if (!stateLoaded) return { ...base, status: "loading" };
  if (mode === "manual") {
    const rows = manualRows(state, cycle, now);
    return { ...base, status: "ready", rows, summary: summarize(rows) };
  }
  if (!snapshot) {
    if (error) return { ...base, status: "error", errorMessage: describeError(error) };
    return { ...base, status: "loading" };
  }
  const staleError = error ? describeError(error) : null;
  if (!hasSchedulerContent(snapshot)) return { ...base, status: "empty", staleError };
  const all = schedulerRows(snapshot, cycle, state);
  const rows = all.filter((r) => r.registered);
  return {
    ...base,
    status: "ready",
    staleError,
    rows,
    unregistered: all.filter((r) => !r.registered),
    homework: homeworkOf(snapshot, cycle),
    summary: summarize(rows),
    weeklyLimit: cycle === "daily" ? null : weeklyBossLimit(snapshot),
  };
}
