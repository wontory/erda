import { getRankingGuild } from "@erda/api/generated/endpoints/ranking/ranking";
import { guildMarkSrc, isWorld, kstYesterday } from "@erda/core";
import { useQuery } from "@tanstack/react-query";

import { STALE, characterKeys } from "#/features/api/query-keys.ts";
import { takePolicy } from "#/features/api/refresh.ts";

import { nullIfNotFound } from "./queries.ts";

export function useGuildMark(world: string, name: string) {
  const key = characterKeys.guildMark(world, name);
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!isWorld(world)) return null;
      const params = { date: kstYesterday(), world_name: world, ranking_type: 0, guild_name: name };
      const res = await getRankingGuild(params, { nexonCache: takePolicy(key) }).catch(nullIfNotFound);
      const hit = res?.ranking?.find((g) => g.guild_name === name && g.world_name === world);
      return guildMarkSrc(hit?.guild_mark);
    },
    staleTime: STALE.guildMark,
    enabled: !!world && !!name,
  }).data;
}
