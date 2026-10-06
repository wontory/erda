import { z } from "zod";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

const schema = z.boolean();

export function useUseScheduler(): [boolean, (v: boolean) => Promise<void>, boolean] {
  const [value, set, loaded] = useDataValue<boolean>(DATA_KEYS.bossUseScheduler, schema, true);
  return [value, set, loaded];
}
