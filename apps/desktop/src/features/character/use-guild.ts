import { useQuery, useQueryClient } from "@tanstack/react-query";

import { STALE, characterKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";

import { fetchGuild } from "./queries.ts";

export function useGuild(world: string, name: string) {
  const key = characterKeys.guild(world, name);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchGuild(world, name, takePolicy(key)),
    staleTime: STALE.guild,
  });
  const refresh = () => refreshQueries(client, [key]);
  return { ...query, refresh };
}
