import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

import { startModeSchema, type StartMode } from "./types.ts";

export function useStartMode(): [StartMode, (mode: StartMode) => Promise<void>, boolean] {
  const [mode, set, loaded] = useDataValue<StartMode>(DATA_KEYS.timerStartMode, startModeSchema, "프리셋");
  return [mode, set, loaded];
}
