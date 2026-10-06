import { describeError, isNotFound } from "@erda/api/errors";
import {
  getRankingAchievement,
  getRankingDojang,
  getRankingOverall,
  getRankingTheseed,
  getRankingUnion,
} from "@erda/api/generated/endpoints/ranking/ranking";
import { GetRankingUnionWorldName } from "@erda/api/generated/model/getRankingUnionWorldName";
import {
  CHARACTER_RANKING_ORDER,
  buildRankingCard,
  findRow,
  isWorld,
  rankingBestDate,
  type CharacterRankingId,
  type RankingCard,
  type RankingCardId,
} from "@erda/core";
import { useQueries, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { STALE, rankingKeys } from "#/features/api/query-keys.ts";
import { refreshQueries, takePolicy } from "#/features/api/refresh.ts";
import { useQueryCacheValue } from "#/features/api/use-cached-query-data.ts";

export type RankingCardState = RankingCard & { loading?: boolean };

type Row = { ranking?: number };
type Fetched = { row: Row | undefined; dojangHard?: boolean };
type RankingTarget = { ocid: string; name: string; world: string };
type RankingContext = RankingTarget & { date: string };
type CardInput = { name: string; world: string; date: string };
type CardQuery = { data: Fetched | undefined; error: unknown; isPending: boolean };

const worldIn = <W extends string>(values: Record<string, W>, world: string): W | undefined =>
  Object.values(values).find((w) => w === world);

async function fetchCard(id: CharacterRankingId, ctx: RankingContext, key: readonly unknown[]): Promise<Fetched> {
  const o = { nexonCache: takePolicy(key) };
  const world = isWorld(ctx.world) ? ctx.world : undefined;
  const mine = <R extends Row>(res: { ranking?: R[] }) => findRow(res.ranking, "character_name", ctx.name);
  switch (id) {
    case "overall":
      return { row: mine(await getRankingOverall({ date: ctx.date, world_name: world, ocid: ctx.ocid }, o)) };
    case "union": {
      const unionWorld = worldIn(GetRankingUnionWorldName, ctx.world);
      return { row: mine(await getRankingUnion({ date: ctx.date, world_name: unionWorld, ocid: ctx.ocid }, o)) };
    }
    case "dojang": {
      const dojang = (difficulty: number) =>
        getRankingDojang({ date: ctx.date, world_name: world, difficulty, ocid: ctx.ocid }, o);
      let hard: Row | undefined;
      try {
        hard = mine(await dojang(1));
      } catch (e) {
        if (!isNotFound(e)) throw e;
      }
      if (hard) return { row: hard, dojangHard: true };
      return { row: mine(await dojang(0)), dojangHard: false };
    }
    case "theseed":
      return { row: mine(await getRankingTheseed({ date: ctx.date, world_name: world, ocid: ctx.ocid }, o)) };
    case "achievement":
      return { row: mine(await getRankingAchievement({ date: ctx.date, ocid: ctx.ocid }, o)) };
  }
}

export function toRankingCardState(id: RankingCardId, input: CardInput, query: CardQuery): RankingCardState {
  if (query.error && !query.data) {
    const card = buildRankingCard(id, { ...input, row: undefined });
    if (isNotFound(query.error)) return { ...card, status: "notFound", detail: "기록 없음" };
    const message = describeError(query.error);
    return { ...card, status: "error", detail: message, error: message };
  }
  const card = buildRankingCard(id, { ...input, row: query.data?.row, dojangHard: query.data?.dojangHard });
  return { ...card, loading: query.isPending };
}

const characterRankingKeys = (ocid: string, date: string) =>
  CHARACTER_RANKING_ORDER.map((id) => rankingKeys.card(id, ocid, date));

export function useRankings(target: RankingTarget | null) {
  const client = useQueryClient();
  const date = rankingBestDate();
  const results = useQueries({
    queries: CHARACTER_RANKING_ORDER.map((id) => {
      const key = rankingKeys.card(id, target?.ocid ?? "", date);
      return {
        queryKey: key,
        queryFn: () => fetchCard(id, { ocid: target!.ocid, world: target!.world, name: target!.name, date }, key),
        enabled: !!target,
        staleTime: STALE.ranking,
      };
    }),
  });
  const input = { name: target?.name ?? "", world: target?.world ?? "", date };
  const cards = CHARACTER_RANKING_ORDER.map((id, i) => toRankingCardState(id, input, results[i]));
  return {
    cards,
    isLoading: results.some((r) => r.isLoading),
    refresh: async () => {
      if (target) await refreshRankings(client, target.ocid);
    },
  };
}

function refreshRankings(client: QueryClient, ocid: string) {
  return refreshQueries(client, characterRankingKeys(ocid, rankingBestDate()));
}

export function useRefreshRankings() {
  const client = useQueryClient();
  return (ocid: string) => refreshRankings(client, ocid);
}

function cachedFirstRanking(client: QueryClient, ocid: string | null): string | null {
  if (!ocid) return null;
  const hit = client.getQueriesData<Fetched>({ queryKey: ["ranking", "overall", ocid] }).find(([, d]) => d?.row);
  const rank = hit?.[1]?.row?.ranking;
  return typeof rank === "number" && rank > 0 ? `종합 #${rank.toLocaleString("en-US")}` : null;
}

export function useCachedFirstRanking(ocid: string | null): string | null {
  return useQueryCacheValue((client) => cachedFirstRanking(client, ocid));
}
