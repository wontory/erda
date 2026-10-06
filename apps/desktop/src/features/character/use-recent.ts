import { addRecent, removeRecent, toFavorite, type CharacterSummary, type FavoriteCharacter } from "@erda/core";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

import { favoriteSchema } from "./use-favorites.ts";

const EMPTY: FavoriteCharacter[] = [];

export function useRecent() {
  const [recent, , loaded, update] = useDataValue<FavoriteCharacter[]>(DATA_KEYS.recent, favoriteSchema, EMPTY);
  return {
    recent,
    loaded,
    record: (s: CharacterSummary) => update((current) => addRecent(current, toFavorite(s))),
    remove: (ocid: string) => update((current) => removeRecent(current, ocid)),
    clear: () => update(() => []),
  };
}
