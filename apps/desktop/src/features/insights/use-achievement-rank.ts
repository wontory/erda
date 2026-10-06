import { getRankingAchievement } from "@erda/api/generated/endpoints/ranking/ranking";
import type { AchievementRankingRankingItem } from "@erda/api/generated/model";
import { findRow, rankingBestDate } from "@erda/core";
import { useQuery } from "@tanstack/react-query";

import { STALE, rankingKeys } from "#/features/api/query-keys.ts";
import { takePolicy } from "#/features/api/refresh.ts";
import { useCachedQueryData } from "#/features/api/use-cached-query-data.ts";

type Row = AchievementRankingRankingItem;
type Fetched = { row: Row | undefined };
type AchievementRank = { grade: string; score: number; rank: number };

const toRank = (row: Row | undefined): AchievementRank | null =>
  row ? { grade: row.trophy_grade ?? "", score: row.trophy_score ?? 0, rank: row.ranking ?? 0 } : null;

export function useAchievementRank(ocid: string | null, name: string, enabled: boolean) {
  const date = rankingBestDate();
  const key = rankingKeys.card("achievement", ocid ?? "", date);
  const q = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Fetched> => {
      const res = await getRankingAchievement({ date, ocid: ocid! }, { nexonCache: takePolicy(key) });
      return { row: findRow(res.ranking, "character_name", name) };
    },
    enabled: enabled && !!ocid,
    staleTime: STALE.ranking,
  });
  return { rank: toRank(q.data?.row), isLoading: q.isLoading, error: q.error };
}

export function useCachedAchievementRank(ocid: string | null): AchievementRank | null {
  const key = ocid ? rankingKeys.card("achievement", ocid, rankingBestDate()) : null;
  return toRank(useCachedQueryData<Fetched>(key)?.row);
}
