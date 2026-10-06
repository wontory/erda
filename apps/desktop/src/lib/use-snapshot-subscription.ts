import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { ZodType } from "zod";

import { errorMessage } from "./action.ts";
import { useTauriEvent } from "./use-tauri-event.ts";

type SnapshotSubscription<T> = {
  data: T;
  loaded: boolean;
  error: string | null;
  retry: () => void;
};

type SnapshotSubscriptionOptions<T> = {
  event: string;
  schema: ZodType<T>;
  snapshot: () => Promise<unknown>;
  initial: T;
  newer: (current: T | null, next: T) => boolean;
};

export function useSnapshotSubscription<T>({
  event,
  schema,
  snapshot,
  initial,
  newer,
}: SnapshotSubscriptionOptions<T>): SnapshotSubscription<T> {
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef<T | null>(null);

  const apply = (next: T) => {
    setLoaded(true);
    if (!newer(latest.current, next)) return;
    latest.current = next;
    setData(next);
  };

  const fail = (message: string) => {
    setLoaded(true);
    setError(message);
  };

  useTauriEvent(event, schema, apply);

  const onSnapshot = useEffectEvent((raw: unknown) => {
    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      setError(null);
      apply(parsed.data);
    } else {
      console.error(`${event} snapshot rejected`, parsed.error);
      fail("받은 정보를 읽을 수 없어요.");
    }
  });

  const onSnapshotError = useEffectEvent((e: unknown) => {
    console.error(`${event} snapshot failed`, e);
    fail(errorMessage(e));
  });

  useEffect(() => {
    let cancelled = false;
    snapshot().then(
      (raw) => {
        if (!cancelled) onSnapshot(raw);
      },
      (e: unknown) => {
        if (!cancelled) onSnapshotError(e);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [snapshot, attempt]);

  return { data, loaded, error, retry: () => setAttempt((n) => n + 1) };
}
