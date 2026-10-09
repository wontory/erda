import { cycleStart, hasApiKey, type BossCycle } from "@erda/core";
import { useEffect, useEffectEvent, useRef } from "react";

import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { useSetting } from "#/features/settings/use-settings.ts";

import { useBossState } from "./use-boss-state.ts";
import { useNow } from "./use-now.ts";
import { useSchedulerState } from "./use-scheduler-state.ts";
import { useUseScheduler } from "./use-use-scheduler.ts";
import { buildBossView } from "./view.ts";

function useOnDayChange(dayStart: number, onChange: () => void) {
  const lastDayStart = useRef(dayStart);
  const fire = useEffectEvent(onChange);
  useEffect(() => {
    if (lastDayStart.current === dayStart) return;
    lastDayStart.current = dayStart;
    fire();
  }, [dayStart]);
}

export function useBossView(cycle: BossCycle) {
  const [apiKey] = useSetting("settings.apiKey");
  const main = useMainCharacter();
  const ocid = main.ocid ?? main.summary?.ocid ?? null;
  const schedulerAvailable = hasApiKey(apiKey) && !!ocid;
  const [useScheduler, setUseScheduler, schedulerSettingLoaded] = useUseScheduler();
  const resolving =
    !schedulerSettingLoaded || (useScheduler && hasApiKey(apiKey) && !ocid && (!main.nameLoaded || main.isPending));
  const mode = schedulerSettingLoaded && schedulerAvailable && useScheduler ? "scheduler" : "manual";
  const boss = useBossState();
  const scheduler = useSchedulerState(ocid, mode === "scheduler");
  const now = useNow();
  const dayStart = cycleStart("daily", now).getTime();
  const schedulerEnabled = mode === "scheduler" && !!ocid;
  useOnDayChange(dayStart, () => {
    if (schedulerEnabled) void scheduler.invalidate();
  });
  const view = buildBossView({
    cycle,
    mode,
    state: boss.state,
    stateLoaded: boss.loaded,
    now,
    snapshot: scheduler.data,
    loading: scheduler.isLoading,
    error: scheduler.error,
  });
  return {
    ...view,
    schedulerAvailable,
    resolving,
    useScheduler,
    setUseScheduler,
    boss,
    now,
    refresh: scheduler.refresh,
    refreshing: scheduler.isFetching,
  };
}
