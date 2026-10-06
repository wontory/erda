import { useSnapshotSubscription } from "#/lib/use-snapshot-subscription.ts";

import { timerCommands } from "./commands.ts";
import { EMPTY_SNAPSHOT, newerSnapshot, timersSnapshotSchema, type ActiveTimer } from "./types.ts";

const snapshot = () => timerCommands.snapshot();

export function useTimers() {
  const { data, loaded, error, retry } = useSnapshotSubscription({
    event: "timers:tick",
    schema: timersSnapshotSchema,
    snapshot,
    initial: EMPTY_SNAPSHOT,
    newer: newerSnapshot,
  });
  const nearest = data.active[0] ?? null;
  const remainingOf = (t: ActiveTimer) => Math.max(0, (t.endMs - data.nowMs) / 1000);
  return { ...data, loaded, error, retry, nearest, remainingOf };
}
