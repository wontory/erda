import { getSchedulerCharacterState } from "@erda/api/generated/endpoints/scheduler/scheduler";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { STALE, bossKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";

export function useSchedulerState(ocid: string | null, enabled: boolean) {
  const client = useQueryClient();
  const key = bossKeys.scheduler(ocid ?? "");
  const query = useQuery({
    queryKey: key,
    queryFn: () => getSchedulerCharacterState({ ocid: ocid! }, { nexonCache: takePolicy(key) }),
    enabled: enabled && !!ocid,
    staleTime: STALE.scheduler,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    invalidate: () => client.invalidateQueries({ queryKey: key }),
    refresh: async () => {
      if (ocid) await refreshQueries(client, [key]);
    },
  };
}
