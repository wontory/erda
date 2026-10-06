import { useCallback, useMemo, useSyncExternalStore } from "react";
import { z, type ZodType } from "zod";

import { createStoreCache } from "#/lib/store.ts";

import { getDataStore } from "./store.ts";

type Parsed<T> = { value: T; corrupt: boolean };

function keepValidItems<T>(raw: unknown, schema: ZodType<T>): T | undefined {
  const whole = schema;
  if (!(schema instanceof z.ZodArray) || !Array.isArray(raw)) return undefined;
  const element = schema.element;
  const kept = whole.safeParse(raw.filter((item) => z.safeParse(element, item).success));
  return kept.success ? kept.data : undefined;
}

function parseStoredDetailed<T>(raw: unknown, schema: ZodType<T>, fallback: T): Parsed<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { value: result.data, corrupt: false };
  if (raw === undefined) return { value: fallback, corrupt: false };
  return { value: keepValidItems(raw, schema) ?? fallback, corrupt: true };
}

const dataCache = createStoreCache<string>({
  getStore: getDataStore,
  parse: (_key, raw) => raw,
  readFailedMessage: "data store read failed",
});

const pending = new Map<string, Promise<unknown>>();

type KeyStore = { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> };

export function updateDataValue<T>(
  key: string,
  schema: ZodType<T>,
  fallback: T,
  updater: (current: T) => T,
  store?: KeyStore,
): Promise<T> {
  const run = async () => {
    const s: KeyStore = store ?? (await getDataStore());
    const raw = await s.get(key);
    const { value, corrupt } = parseStoredDetailed(raw, schema, fallback);
    if (corrupt) {
      const backup = `${key}.corrupt.${Date.now()}`;
      console.error("stored data is corrupt; backing it up before overwrite", key, backup);
      await s.set(backup, raw);
    }
    const next = updater(value);
    await s.set(key, next);
    if (!store) dataCache.put(key, next);
    return next;
  };
  const result = (pending.get(key) ?? Promise.resolve()).then(run, run);
  pending.set(
    key,
    result.catch(() => undefined),
  );
  return result;
}

type DataValue<T> = [
  value: T,
  set: (value: T) => Promise<void>,
  loaded: boolean,
  update: (updater: (current: T) => T) => Promise<void>,
];

export function useDataValue<T>(key: string, schema: ZodType<T>, fallback: T): DataValue<T> {
  const subscribe = useCallback((listener: () => void) => dataCache.subscribe(key, listener), [key]);
  const raw = useSyncExternalStore(subscribe, () => dataCache.get(key));
  const loaded = useSyncExternalStore(subscribe, () => dataCache.has(key));

  const value = useMemo(() => {
    if (!loaded) return fallback;
    const { value: parsed, corrupt } = parseStoredDetailed(raw, schema, fallback);
    if (corrupt) console.error("stored data is corrupt; showing what could be read", key);
    return parsed;
  }, [key, raw, loaded, schema, fallback]);

  const update = useCallback(
    async (updater: (current: T) => T) => {
      await updateDataValue(key, schema, fallback, updater);
    },
    [key, schema, fallback],
  );

  const set = useCallback((next: T) => dataCache.putOptimistic(key, next, () => update(() => next)), [key, update]);

  return [value, set, loaded, update];
}
