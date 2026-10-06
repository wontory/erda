import { NexonError, isNotFound } from "@erda/api/errors";
import {
  getCharacterBasic,
  getCharacterPopularity,
  getCharacterStat,
  getId,
} from "@erda/api/generated/endpoints/character/character";
import { getGuildBasic, getGuildId } from "@erda/api/generated/endpoints/guild/guild";
import { getRankingGuild } from "@erda/api/generated/endpoints/ranking/ranking";
import type { NexonCachePolicy } from "@erda/api/mutator";
import {
  WORLDS,
  buildSummary,
  guildHitId,
  isWorld,
  rankingBestDate,
  type CharacterSummary,
  type GuildHit,
} from "@erda/core";

export { characterKeys } from "#/features/api/query-keys.ts";

export const nullIfNotFound = (e: unknown): null => {
  if (isNotFound(e)) return null;
  throw e;
};

const opts = (policy: NexonCachePolicy) => ({ nexonCache: policy });

export async function lookupOcid(name: string, policy: NexonCachePolicy = "useCache"): Promise<string> {
  const res = await getId({ character_name: name }, opts(policy));
  if (!res.ocid) throw new NexonError({ kind: "emptyResponse", message: "" });
  return res.ocid;
}

export async function fetchSummary(ocid: string, policy: NexonCachePolicy = "useCache"): Promise<CharacterSummary> {
  const [basic, stat, popularity] = await Promise.all([
    getCharacterBasic({ ocid }, opts(policy)),
    getCharacterStat({ ocid }, opts(policy)),
    getCharacterPopularity({ ocid }, opts(policy)).then((p) => p.popularity ?? null, nullIfNotFound),
  ]);
  return buildSummary(ocid, basic, stat, popularity, new Date());
}

export async function searchCharacter(
  name: string,
  policy: NexonCachePolicy = "useCache",
): Promise<CharacterSummary | null> {
  try {
    const ocid = await lookupOcid(name, policy);
    return await fetchSummary(ocid, policy);
  } catch (e) {
    return nullIfNotFound(e);
  }
}

async function rankedGuildHits(name: string, policy: NexonCachePolicy): Promise<GuildHit[]> {
  const ranking = await getRankingGuild(
    { date: rankingBestDate(), ranking_type: 0, guild_name: name },
    opts(policy),
  ).catch((e: unknown) => {
    if (isNotFound(e)) return { ranking: [] };
    throw NexonError.from(e);
  });
  const seen = new Set<string>();
  const hits: GuildHit[] = [];
  for (const r of ranking.ranking ?? []) {
    if (r.guild_name !== name || !r.world_name) continue;
    const hit = { world: r.world_name, name, level: r.guild_level ?? null, master: r.guild_master_name ?? null };
    if (seen.has(guildHitId(hit))) continue;
    seen.add(guildHitId(hit));
    hits.push(hit);
  }
  return hits;
}

async function guildHitIn(
  world: (typeof WORLDS)[number],
  name: string,
  policy: NexonCachePolicy,
): Promise<GuildHit | null> {
  const id = await getGuildId({ guild_name: name, world_name: world }, opts(policy));
  if (!id.oguild_id) return null;
  const basic = await getGuildBasic({ oguild_id: id.oguild_id }, opts(policy)).catch(nullIfNotFound);
  return { world, name, level: basic?.guild_level ?? null, master: basic?.guild_master_name ?? null };
}

async function guildHitsInEveryWorld(name: string, policy: NexonCachePolicy): Promise<GuildHit[]> {
  const results = await Promise.allSettled(WORLDS.map((world) => guildHitIn(world, name, policy)));
  const found = results.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []));
  if (found.length > 0 || results.some((r) => r.status === "fulfilled")) return found;
  const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected" && !isNotFound(r.reason));
  if (failure) throw NexonError.from(failure.reason);
  return found;
}

export async function searchGuilds(
  name: string,
  policy: NexonCachePolicy = "useCache",
  { allWorlds = false }: { allWorlds?: boolean } = {},
): Promise<GuildHit[]> {
  const hits = await rankedGuildHits(name, policy);
  if (hits.length > 0 || !allWorlds) return hits;
  return guildHitsInEveryWorld(name, policy);
}

export async function fetchGuild(world: string, name: string, policy: NexonCachePolicy = "useCache") {
  if (!isWorld(world)) throw new NexonError({ kind: "invalidParameter", message: world });
  const id = await getGuildId({ guild_name: name, world_name: world }, opts(policy));
  if (!id.oguild_id) throw new NexonError({ kind: "emptyResponse", message: "" });
  const basic = await getGuildBasic({ oguild_id: id.oguild_id }, opts(policy));
  return { ...basic, oguildId: id.oguild_id };
}
