import type { CharacterSummary } from "@erda/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { STALE, characterKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";

import { fetchSummary } from "./queries.ts";

const summarySchema = z.object({
  ocid: z.string(),
  name: z.string(),
  world: z.string(),
  job: z.string(),
  classLevel: z.string(),
  level: z.number(),
  exp: z.string(),
  expRate: z.string(),
  guild: z.string().nullable(),
  image: z.string(),
  popularity: z.number().nullable(),
  battlePower: z.number(),
  stats: z.array(z.object({ name: z.string(), value: z.string() })),
  fetchedAt: z.string(),
}) satisfies z.ZodType<CharacterSummary>;

export const mainSummarySchema = summarySchema.nullable();

export function useCharacterSummary(ocid: string | null, initial?: CharacterSummary | null) {
  const key = characterKeys.summary(ocid ?? "");
  const seed = initial && initial.ocid === ocid ? initial : undefined;
  return useQuery({
    queryKey: key,
    queryFn: () => fetchSummary(ocid!, takePolicy(key)),
    enabled: !!ocid,
    staleTime: STALE.summary,
    initialData: seed,
    initialDataUpdatedAt: seed ? Date.parse(seed.fetchedAt) : undefined,
  });
}

export function useRefreshSummary() {
  const client = useQueryClient();
  return (ocid: string) => refreshQueries(client, [characterKeys.summary(ocid)]);
}
