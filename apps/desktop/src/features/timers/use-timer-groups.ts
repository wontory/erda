import { DEFAULT_GROUPS, timerGroupsSchema, type TimerGroup } from "@erda/core";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

import { moveGroup, removeGroup, upsertGroup } from "./groups-ops.ts";

export function useTimerGroups() {
  const [groups, , loaded, update] = useDataValue<TimerGroup[]>(
    DATA_KEYS.timerGroups,
    timerGroupsSchema,
    DEFAULT_GROUPS,
  );
  return {
    groups,
    loaded,
    save: (group: TimerGroup) => update((current) => upsertGroup(current, group)),
    remove: (id: string) => update((current) => removeGroup(current, id)),
    move: (id: string, delta: number) => update((current) => moveGroup(current, id, delta)),
  };
}
