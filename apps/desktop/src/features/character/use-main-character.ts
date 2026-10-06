import type { AccountCharacter, CharacterSummary } from "@erda/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect } from "react";

import { STALE, characterKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";
import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";
import { useSetting } from "#/features/settings/use-settings.ts";

import { lookupOcid } from "./queries.ts";
import { useAccountCharacters } from "./use-account-characters.ts";
import { mainSummarySchema, useCharacterSummary, useRefreshSummary } from "./use-character-summary.ts";

const storedFor = (stored: CharacterSummary | null, name: string) => (stored && stored.name === name ? stored : null);

const highestLevel = (characters: AccountCharacter[]) => characters.toSorted((a, b) => b.level - a.level)[0];

function useStoredMain() {
  return useDataValue<CharacterSummary | null>(DATA_KEYS.main, mainSummarySchema, null);
}

export function useStoredMainOcid(): string | null {
  const [name] = useSetting("settings.mainCharacterName");
  const [stored] = useStoredMain();
  return storedFor(stored, name.trim())?.ocid ?? null;
}

function useAutoPickMain(name: string, nameLoaded: boolean, setName: (next: string) => Promise<void>) {
  const account = useAccountCharacters(nameLoaded);
  useEffect(() => {
    if (!nameLoaded || name || account.characters.length === 0) return;
    const top = highestLevel(account.characters);
    if (top) setName(top.name).catch((e) => console.error("auto main character save failed", e));
  }, [nameLoaded, name, account.characters, setName]);
}

export function useMainCharacterState() {
  const [rawName, setName, nameLoaded] = useSetting("settings.mainCharacterName");
  const name = rawName.trim();
  const [stored, setStored, storedLoaded] = useStoredMain();
  useAutoPickMain(name, nameLoaded, setName);

  const cached = storedFor(stored, name);
  const cachedOcid = cached?.ocid ?? null;
  const ocidKey = characterKeys.ocid(name);
  const ocidQuery = useQuery({
    queryKey: ocidKey,
    queryFn: () => lookupOcid(name, takePolicy(ocidKey)),
    enabled: nameLoaded && storedLoaded && !!name && !cachedOcid,
    staleTime: STALE.ocid,
  });
  const ocid = cachedOcid ?? ocidQuery.data ?? null;
  const summary = useCharacterSummary(ocid, stored);
  const refreshSummary = useRefreshSummary();
  const client = useQueryClient();

  useEffect(() => {
    if (summary.data && summary.data.ocid === ocid)
      setStored(summary.data).catch((e) => console.error("main summary save failed", e));
  }, [summary.data, ocid, setStored]);

  const loading = !storedLoaded || ocidQuery.isLoading || (!!ocid && summary.isPending);

  return {
    name,
    nameLoaded,
    ocid,
    summary: summary.data ?? cached,
    isPending: nameLoaded && !!name && loading,
    error: ocidQuery.error ?? summary.error ?? null,
    refresh: async () => {
      if (ocid) return refreshSummary(ocid);
      if (name) await refreshQueries(client, [ocidKey]);
    },
    setMain: (next: string) => setName(next),
  };
}

export type MainCharacter = ReturnType<typeof useMainCharacterState>;

export const MainCharacterContext = createContext<MainCharacter | null>(null);

export function useMainCharacter(): MainCharacter {
  const ctx = useContext(MainCharacterContext);
  if (!ctx) throw new Error("useMainCharacter outside MainCharacterProvider");
  return ctx;
}
