import type { CharacterSummary, StatEntry } from "./types.ts";

export interface BasicLike {
  character_name?: string | null;
  world_name?: string | null;
  character_class?: string | null;
  character_class_level?: string | null;
  character_level?: number | null;
  character_exp?: number | string | null;
  character_exp_rate?: string | null;
  character_guild_name?: string | null;
  character_image?: string | null;
  character_gender?: string | null;
  character_date_create?: string | null;
}

export interface StatLike {
  final_stat?: Array<{ stat_name?: string | null; stat_value?: string | null }> | null;
}

export function parseNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function buildSummary(
  ocid: string,
  basic: BasicLike,
  stat: StatLike,
  popularity: number | null,
  now: Date,
): CharacterSummary {
  const stats: StatEntry[] = (stat.final_stat ?? []).map((s) => ({
    name: s.stat_name ?? "",
    value: s.stat_value ?? "",
  }));
  const power = stats.find((s) => s.name === "전투력");
  return {
    ocid,
    name: basic.character_name ?? "",
    world: basic.world_name ?? "",
    job: basic.character_class ?? "",
    classLevel: basic.character_class_level ?? "",
    level: basic.character_level ?? 0,
    exp: String(basic.character_exp ?? ""),
    expRate: basic.character_exp_rate ?? "0",
    guild: basic.character_guild_name ? basic.character_guild_name : null,
    image: basic.character_image ?? "",
    popularity,
    battlePower: power ? parseNumber(power.value) : 0,
    stats,
    fetchedAt: now.toISOString(),
  };
}
