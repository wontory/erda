import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

export function useQueryCacheValue<T>(read: (client: QueryClient) => T): T {
  const client = useQueryClient();
  const subscribe = useCallback((onChange: () => void) => client.getQueryCache().subscribe(onChange), [client]);
  return useSyncExternalStore(subscribe, () => read(client));
}

export function useCachedQueryData<T>(key: QueryKey | null): T | undefined {
  return useQueryCacheValue((client) => (key ? client.getQueryData<T>(key) : undefined));
}
