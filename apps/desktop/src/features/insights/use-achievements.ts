import { getUserAchievement } from "@erda/api/generated/endpoints/user/user";
import { flattenAchievements, type Achievement } from "@erda/core";
import { useQuery } from "@tanstack/react-query";

import { STALE, achievementsKey } from "#/features/api/query-keys.ts";
import { useCachedQueryData } from "#/features/api/use-cached-query-data.ts";

export function useAchievements(enabled = true) {
  return useQuery({
    queryKey: achievementsKey,
    queryFn: async () => flattenAchievements(await getUserAchievement({ nexonCache: "useCache" })),
    staleTime: STALE.forever,
    gcTime: Infinity,
    enabled,
  });
}

export function useCachedAchievements(): Achievement[] | undefined {
  return useCachedQueryData<Achievement[]>(achievementsKey);
}
