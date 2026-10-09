import { load, type Store, type StoreOptions } from "@tauri-apps/plugin-store";

export function lazyStore(path: string, options: StoreOptions): () => Promise<Store> {
  let storePromise: Promise<Store> | undefined;
  return () => {
    storePromise ??= load(path, options).catch((error) => {
      storePromise = undefined;
      throw error;
    });
    return storePromise;
  };
}

type StoreCacheOptions<K extends string> = {
  getStore: () => Promise<Store>;
  parse: (key: K, raw: unknown) => unknown;
  readFailedMessage: string;
};

export function createStoreCache<K extends string>({ getStore, parse, readFailedMessage }: StoreCacheOptions<K>) {
  const values = new Map<K, unknown>();
  const listeners = new Map<K, Set<() => void>>();
  const watching = new Set<K>();

  const notify = (key: K) => {
    for (const listener of listeners.get(key) ?? []) listener();
  };

  const put = (key: K, value: unknown) => {
    values.set(key, value);
    notify(key);
  };

  const forget = (key: K) => {
    values.delete(key);
    notify(key);
  };

  const watch = (key: K) => {
    if (watching.has(key)) return;
    watching.add(key);
    getStore()
      .then(async (store) => {
        put(key, parse(key, await store.get<unknown>(key)));
        await store.onKeyChange<unknown>(key, (next) => put(key, parse(key, next)));
      })
      .catch((error) => {
        watching.delete(key);
        console.error(readFailedMessage, key, error);
        if (!values.has(key)) put(key, parse(key, undefined));
      });
  };

  const subscribe = (key: K, listener: () => void) => {
    watch(key);
    let set = listeners.get(key);
    if (!set) listeners.set(key, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };

  const putOptimistic = async (key: K, next: unknown, write: () => Promise<void>) => {
    const had = values.has(key);
    const previous = values.get(key);
    put(key, next);
    try {
      await write();
    } catch (error) {
      if (values.get(key) === next) {
        if (had) put(key, previous);
        else forget(key);
      }
      throw error;
    }
  };

  return {
    has: (key: K) => values.has(key),
    get: (key: K) => values.get(key),
    put,
    subscribe,
    putOptimistic,
  };
}
