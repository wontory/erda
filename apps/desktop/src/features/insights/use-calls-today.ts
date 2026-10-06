import { useEffect, useState } from "react";

import { useSetting } from "#/features/settings/use-settings.ts";
import { usePanelVisibility } from "#/lib/tauri.ts";

import { fetchCallsToday } from "./commands.ts";

const POLL_MS = 15_000;

export function useCallsToday() {
  const [budget] = useSetting("settings.historySyncDailyBudget");
  const visible = usePanelVisibility();
  const [calls, setCalls] = useState<number | null>(null);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const tick = () =>
      fetchCallsToday()
        .then((n) => {
          if (!cancelled) setCalls(n);
        })
        .catch((e) => console.error("nexon_calls_today failed", e));
    void tick();
    const t = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [visible]);
  return { calls, budget, over: calls !== null && calls >= budget };
}
