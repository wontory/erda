import { DEFAULT_POTENTIAL_SETTINGS, potentialSettingsSchema, type PotentialSettings } from "@erda/core";
import { useCallback } from "react";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

export function usePotentialSettings() {
  const [settings, , loaded, update] = useDataValue<PotentialSettings>(
    DATA_KEYS.potentialSettings,
    potentialSettingsSchema,
    DEFAULT_POTENTIAL_SETTINGS,
  );
  const patch = useCallback(
    (p: Partial<PotentialSettings>) => void update((current) => ({ ...current, ...p })),
    [update],
  );
  return { settings, loaded, patch };
}
