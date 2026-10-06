import { SETTINGS_DEFAULTS, SettingsSchema, type Settings, type SettingsKey } from "@erda/core";
import { useCallback, useSyncExternalStore } from "react";

import { createStoreCache } from "#/lib/store.ts";

import { getSettingsStore } from "./store.ts";

export function parseSetting<K extends SettingsKey>(key: K, raw: unknown): Settings[K] {
  const parsed = SettingsSchema.shape[key].safeParse(raw);
  if (parsed.success) return parsed.data as Settings[K];
  console.error("invalid stored setting, using default", key, parsed.error);
  return SETTINGS_DEFAULTS[key];
}

const settingsCache = createStoreCache<SettingsKey>({
  getStore: getSettingsStore,
  parse: parseSetting,
  readFailedMessage: "failed to read setting",
});

async function writeSetting<K extends SettingsKey>(key: K, value: Settings[K]) {
  try {
    const store = await getSettingsStore();
    await store.set(key, value);
  } catch (error) {
    console.error("failed to write setting", key, error);
    throw error;
  }
}

export function useSetting<K extends SettingsKey>(
  key: K,
): [Settings[K], (value: Settings[K]) => Promise<void>, boolean] {
  const subscribe = useCallback((listener: () => void) => settingsCache.subscribe(key, listener), [key]);
  const value = useSyncExternalStore(
    subscribe,
    () => (settingsCache.has(key) ? settingsCache.get(key) : SETTINGS_DEFAULTS[key]) as Settings[K],
  );
  const loaded = useSyncExternalStore(subscribe, () => settingsCache.has(key));

  const set = useCallback(
    (next: Settings[K]) => settingsCache.putOptimistic(key, next, () => writeSetting(key, next)),
    [key],
  );

  return [value, set, loaded];
}
