import {
  DEFAULT_BOSS_STATE,
  bossStateSchema,
  setParty,
  setPrice,
  toggleClear,
  toggleSelected,
  type BossState,
} from "@erda/core";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

export function useBossState() {
  const [state, , loaded, update] = useDataValue<BossState>(DATA_KEYS.bossState, bossStateSchema, DEFAULT_BOSS_STATE);
  return {
    state,
    loaded,
    toggleSelected: (id: string) => update((s) => toggleSelected(s, id)),
    toggleClear: (id: string) => update((s) => toggleClear(s, id, new Date())),
    setParty: (id: string, n: number) => update((s) => setParty(s, id, n)),
    setPrice: (id: string, n: number) => update((s) => setPrice(s, id, n)),
  };
}
