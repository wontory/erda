import type { FavoriteCharacter } from "./types.ts";

export const RECENT_MAX = 10;

export function addRecent(list: FavoriteCharacter[], entry: FavoriteCharacter): FavoriteCharacter[] {
  return [entry, ...list.filter((x) => x.ocid !== entry.ocid)].slice(0, RECENT_MAX);
}

export function removeRecent(list: FavoriteCharacter[], ocid: string): FavoriteCharacter[] {
  return list.filter((x) => x.ocid !== ocid);
}
