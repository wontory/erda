import { getCharacterList } from "@erda/api/generated/endpoints/user/user";
import type { AccountCharacter } from "@erda/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";

import { STALE, characterKeys } from "#/features/api/query-keys.ts";
import { takePolicy } from "#/features/api/refresh.ts";
import { DATA_KEYS } from "#/features/data/store.ts";
import { updateDataValue, useDataValue } from "#/features/data/use-data-value.ts";

type CharacterList = Awaited<ReturnType<typeof getCharacterList>>;

const accountSchema = z.array(
  z.object({ ocid: z.string(), name: z.string(), world: z.string(), job: z.string(), level: z.number() }),
);
const EMPTY: AccountCharacter[] = [];

const store = (list: AccountCharacter[]) =>
  updateDataValue(DATA_KEYS.accountList, accountSchema, EMPTY, () => list).catch((e) =>
    console.error("account list save failed", e),
  );

export const clearAccountList = () => store([]);

function toAccountCharacters(list: CharacterList): AccountCharacter[] {
  return (list.account_list ?? [])
    .flatMap((account) =>
      (account.character_list ?? []).map((c) => ({
        ocid: c.ocid ?? "",
        name: c.character_name ?? "",
        world: c.world_name ?? "",
        job: c.character_class ?? "",
        level: c.character_level ?? 0,
      })),
    )
    .filter((c) => c.ocid);
}

function groupByWorld(characters: AccountCharacter[]) {
  const map = new Map<string, AccountCharacter[]>();
  for (const c of characters) map.set(c.world, [...(map.get(c.world) ?? []), c]);
  return [...map.entries()]
    .map(([world, cs]) => ({ world, characters: cs.toSorted((a, b) => b.level - a.level) }))
    .toSorted((a, b) => b.characters.length - a.characters.length || a.world.localeCompare(b.world, "ko"));
}

export function useAccountCharacters(enabled = true) {
  const [stored] = useDataValue<AccountCharacter[]>(DATA_KEYS.accountList, accountSchema, EMPTY);
  const query = useQuery({
    queryKey: characterKeys.account,
    queryFn: async () => {
      const characters = toAccountCharacters(await getCharacterList({ nexonCache: takePolicy(characterKeys.account) }));
      await store(characters);
      return characters;
    },
    enabled,
    staleTime: STALE.account,
  });
  const characters = query.data ?? stored;
  const byWorld = useMemo(() => groupByWorld(characters), [characters]);
  return {
    characters,
    byWorld,
    isPending: query.isPending && stored.length === 0,
    error: query.error,
    refetch: query.refetch,
  };
}
