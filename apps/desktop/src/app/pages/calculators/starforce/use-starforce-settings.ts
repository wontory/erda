import { DEFAULT_STARFORCE_SETTINGS, starforceSettingsSchema, type StarforceSettings } from "@erda/core";
import { useCallback } from "react";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

export function useStarforceSettings() {
  const [settings, , , update] = useDataValue<StarforceSettings>(
    DATA_KEYS.starforceSettings,
    starforceSettingsSchema,
    DEFAULT_STARFORCE_SETTINGS,
  );
  const patch = useCallback(
    (p: Partial<StarforceSettings>) => void update((current) => ({ ...current, ...p })),
    [update],
  );
  return { settings, patch };
}
