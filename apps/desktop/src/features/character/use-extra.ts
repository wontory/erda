import type { NexonCachePolicy } from "@erda/api/mutator";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { STALE, characterKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";

type ExtraOptions = { enabled?: boolean; extraKey?: string; staleTime?: number };

export function useExtra<T>(
  kind: string,
  ocid: string,
  fetcher: (policy: NexonCachePolicy) => Promise<T>,
  options: ExtraOptions = {},
) {
  const key = characterKeys.extra(kind, ocid, options.extraKey ?? "");
  return useQuery({
    queryKey: key,
    queryFn: () => fetcher(takePolicy(key)),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? STALE.extra,
    placeholderData: (prev, prevQuery) => {
      const sameTarget = prevQuery && prevQuery.queryKey[1] === kind && prevQuery.queryKey[2] === ocid;
      return sameTarget ? prev : undefined;
    },
  });
}

export function useRefreshExtras(ocid: string) {
  const client = useQueryClient();
  return async (kinds: Array<[kind: string, extraKey?: string]>) => {
    const keys = kinds.map(([kind, extraKey]) => characterKeys.extra(kind, ocid, extraKey ?? ""));
    const active = keys.filter((key) => client.getQueryState(key));
    await refreshQueries(client, active);
  };
}
