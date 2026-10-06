import { NexonError, describeError } from "@erda/api/errors";
import { toastManager } from "@erda/ui/lib/toast";
import { useCallback, useRef, useState } from "react";

const HANGUL = /[가-힣]/;
const GENERIC_MESSAGE = "잠시 뒤에 다시 시도해 주세요.";

export function errorMessage(e: unknown): string {
  if (e instanceof NexonError || (typeof e === "object" && e !== null && "kind" in e)) return describeError(e);
  const raw = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return HANGUL.test(raw) ? raw : GENERIC_MESSAGE;
}

export async function runAction<T>(fn: () => Promise<T>, failTitle: string): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    console.error(failTitle, e);
    toastManager.add({ type: "error", title: failTitle, description: errorMessage(e) });
    return undefined;
  }
}

export function useAction() {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const run = useCallback(async <T>(fn: () => Promise<T>, failTitle: string): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setPending(true);
    try {
      return await runAction(fn, failTitle);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, []);
  return { run, pending };
}
