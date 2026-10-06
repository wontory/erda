import type { CharacterRankingId } from "@erda/core";

export const characterKeys = {
  summary: (ocid: string) => ["character", "summary", ocid] as const,
  ocid: (name: string) => ["character", "ocid", name] as const,
  account: ["character", "account"] as const,
  search: (q: string) => ["search", "character", q] as const,
  guildSearch: (q: string, allWorlds: boolean) => ["search", "guild", q, allWorlds ? "all" : "ranking"] as const,
  extra: (kind: string, ocid: string, extraKey = "") => ["extra", kind, ocid, extraKey] as const,
  guild: (world: string, name: string) => ["guild", world, name] as const,
  guildMark: (world: string, name: string) => ["guildMark", world, name] as const,
};

export const rankingKeys = {
  card: (id: CharacterRankingId, ocid: string, date: string) => ["ranking", id, ocid, date] as const,
  guildPage: (world: string, guildName: string, date: string) =>
    ["ranking", "guild-page", world, guildName, date] as const,
};

export const battleKeys = {
  list: (ocid: string) => ["insights", "battle", ocid] as const,
  result: (id: string) => ["insights", "battle-result", id] as const,
};

export const achievementsKey = ["insights", "achievements"] as const;

export const bossKeys = { scheduler: (ocid: string) => ["boss", "scheduler", ocid] as const };

export const newsKeys = { detail: (id: string) => ["news", "detail", id] as const };

const MINUTE = 60_000;

export const STALE = {
  summary: 15 * MINUTE,
  extra: 10 * MINUTE,
  account: 10 * MINUTE,
  characterSearch: 5 * MINUTE,
  guildSearch: 10 * MINUTE,
  guild: 10 * MINUTE,
  guildMark: 24 * 60 * MINUTE,
  ocid: 24 * 60 * MINUTE,
  ranking: 10 * MINUTE,
  battle: 10 * MINUTE,
  scheduler: 2 * MINUTE,
  forever: Infinity,
} as const;
