import { useQuery } from "@tanstack/react-query";

import { STALE } from "#/features/api/query-keys.ts";
import { takePolicy } from "#/features/api/refresh.ts";

import { characterKeys, searchCharacter, searchGuilds } from "./queries.ts";

export function normalizeQuery(raw: string): string | null {
  const q = raw.trim();
  return q.length > 0 ? q : null;
}

export function useCharacterSearch(query: string) {
  const key = characterKeys.search(query);
  return useQuery({
    queryKey: key,
    queryFn: () => searchCharacter(query, takePolicy(key)),
    enabled: !!query,
    staleTime: STALE.characterSearch,
  });
}

export function useGuildSearch(query: string, { allWorlds = false }: { allWorlds?: boolean } = {}) {
  const key = characterKeys.guildSearch(query, allWorlds);
  return useQuery({
    queryKey: key,
    queryFn: () => searchGuilds(query, takePolicy(key), { allWorlds }),
    enabled: !!query,
    staleTime: STALE.guildSearch,
  });
}
