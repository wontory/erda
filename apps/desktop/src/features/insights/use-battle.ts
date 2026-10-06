import { isNotFound } from "@erda/api/errors";
import {
  getBattlePracticeReplayId,
  getBattlePracticeResult,
} from "@erda/api/generated/endpoints/battle-practice/battle-practice";
import { topReplays, type Replay } from "@erda/core";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { STALE, battleKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";

async function fetchReplays(ocid: string): Promise<Replay[]> {
  try {
    const res = await getBattlePracticeReplayId({ ocid }, { nexonCache: takePolicy(battleKeys.list(ocid)) });
    return topReplays(res);
  } catch (e) {
    if (isNotFound(e)) return [];
    throw e;
  }
}

export function useBattle(ocid: string | null) {
  const list = useQuery({
    queryKey: battleKeys.list(ocid ?? ""),
    queryFn: () => fetchReplays(ocid!),
    enabled: !!ocid,
    staleTime: STALE.battle,
  });
  const replays = list.data ?? [];
  const results = useQueries({
    queries: replays.map((r) => ({
      queryKey: battleKeys.result(r.id),
      queryFn: () => getBattlePracticeResult({ replay_id: r.id }, { nexonCache: "useCache" }),
      staleTime: STALE.forever,
    })),
  });
  return {
    replays,
    results,
    isIdle: !ocid,
    isLoading: list.isLoading,
    error: list.data ? null : list.error,
    retry: () => void list.refetch(),
  };
}

export function useRefreshBattle() {
  const client = useQueryClient();
  return (ocid: string) => refreshQueries(client, [battleKeys.list(ocid)]);
}
