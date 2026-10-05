export interface StatEntry {
  name: string;
  value: string;
}

export interface CharacterSummary {
  ocid: string;
  name: string;
  world: string;
  job: string;
  classLevel: string;
  level: number;
  exp: string;
  expRate: string;
  guild: string | null;
  image: string;
  popularity: number | null;
  battlePower: number;
  stats: StatEntry[];
  fetchedAt: string;
}

export interface FavoriteCharacter {
  ocid: string;
  name: string;
  world: string;
  job: string;
  image: string;
}

export interface AccountCharacter {
  ocid: string;
  name: string;
  world: string;
  job: string;
  level: number;
}

export interface GuildHit {
  world: string;
  name: string;
  level: number | null;
  master: string | null;
}

export const guildHitId = (h: Pick<GuildHit, "world" | "name">) => `${h.world}|${h.name}`;

export const toFavorite = (s: CharacterSummary): FavoriteCharacter => ({
  ocid: s.ocid,
  name: s.name,
  world: s.world,
  job: s.job,
  image: s.image,
});
