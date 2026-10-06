import {
  HISTORY_KINDS,
  HistorySync,
  aggregate,
  kstToday,
  type HistoryAggregate,
  type HistoryArchive,
  type HistoryKind,
  type KindSync,
} from "@erda/core";
import { useCallback, useEffect, useSyncExternalStore } from "react";

import { createPorts } from "./ports.ts";

type HistorySummary = { aggregate: HistoryAggregate | null; state: KindSync };

const THROTTLE_MS = 500;
let sync: HistorySync | null = null;
let version = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  for (const l of listeners) l();
}

function notify() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    emit();
  }, THROTTLE_MS);
}

function emitNow() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  emit();
}

function getSync(): HistorySync {
  sync ??= new HistorySync(createPorts(), notify);
  return sync;
}

const aggregates = new WeakMap<HistoryArchive, { today: string; value: HistoryAggregate }>();

function aggregateOf(archive: HistoryArchive, today: string): HistoryAggregate {
  const hit = aggregates.get(archive);
  if (hit && hit.today === today) return hit.value;
  const value = aggregate(archive, today);
  aggregates.set(archive, { today, value });
  return value;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const useVersion = () => useSyncExternalStore(subscribe, () => version);

function summaryOf(s: HistorySync, kind: HistoryKind): HistorySummary {
  const archive = s.archive(kind);
  return { aggregate: archive ? aggregateOf(archive, kstToday()) : null, state: s.state(kind) };
}

export function useHistory(kind: HistoryKind) {
  useVersion();
  const s = getSync();
  const { aggregate: agg, state } = summaryOf(s, kind);
  const open = useCallback(() => s.open(kind), [s, kind]);
  const refresh = useCallback(() => s.refresh(kind), [s, kind]);
  return { archive: s.archive(kind), state, aggregate: agg, epoch: s.epoch, open, refresh };
}

export function resetHistory() {
  getSync().reset();
  emitNow();
}

export function nudgeHistory() {
  sync?.nudge();
}

export function useHistorySummaries(): Record<HistoryKind, HistorySummary> {
  useVersion();
  const s = getSync();
  const epoch = s.epoch;
  useEffect(() => {
    for (const k of HISTORY_KINDS) void s.load(k);
  }, [s, epoch]);
  const out = {} as Record<HistoryKind, HistorySummary>;
  for (const k of HISTORY_KINDS) out[k] = summaryOf(s, k);
  return out;
}
