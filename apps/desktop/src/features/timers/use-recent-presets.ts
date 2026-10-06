import { z } from "zod";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

import { pushRecent, quickStartPresets } from "./recent.ts";

const schema = z.array(z.string());
const EMPTY: string[] = [];

export function useRecentPresets() {
  const [ids, , , update] = useDataValue<string[]>(DATA_KEYS.recentPresets, schema, EMPTY);
  return { ids, presets: quickStartPresets(ids), push: (id: string) => update((current) => pushRecent(current, id)) };
}
