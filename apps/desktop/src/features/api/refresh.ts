import type { NexonCachePolicy } from "@erda/api/mutator";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

const pending = new Set<string>();

export const keyString = (key: QueryKey) => JSON.stringify(key);

export function markRefresh(keys: QueryKey[]) {
  for (const k of keys) pending.add(keyString(k));
}

export function takePolicy(key: QueryKey): NexonCachePolicy {
  return pending.delete(keyString(key)) ? "refresh" : "useCache";
}

export async function refreshQueries(client: QueryClient, keys: QueryKey[]) {
  markRefresh(keys);
  await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
