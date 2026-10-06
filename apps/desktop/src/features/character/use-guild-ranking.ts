import { getRankingGuild } from "@erda/api/generated/endpoints/ranking/ranking";
import { findRow, isWorld, rankingBestDate } from "@erda/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { STALE, rankingKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";
import { toRankingCardState } from "#/features/insights/use-rankings.ts";

export function useGuildRanking(world: string, guildName: string, enabled = true) {
  const client = useQueryClient();
  const date = rankingBestDate();
  const key = rankingKeys.guildPage(world, guildName, date);
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!isWorld(world)) return { row: undefined };
      const res = await getRankingGuild(
        { date, world_name: world, ranking_type: 0, guild_name: guildName },
        { nexonCache: takePolicy(key) },
      );
      return { row: findRow(res.ranking, "guild_name", guildName) };
    },
    enabled,
    staleTime: STALE.ranking,
  });
  const card = toRankingCardState("guild", { name: guildName, world, date }, query);
  const refresh = () => refreshQueries(client, [key]);
  return { card, refresh };
}
