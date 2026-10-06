import { toFavorite, type CharacterSummary, type FavoriteCharacter } from "@erda/core";
import { z } from "zod";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

export const favoriteSchema = z.array(
  z.object({ ocid: z.string(), name: z.string(), world: z.string(), job: z.string(), image: z.string() }),
);
const EMPTY: FavoriteCharacter[] = [];

export function useFavorites() {
  const [favorites, , loaded, update] = useDataValue<FavoriteCharacter[]>(DATA_KEYS.favorites, favoriteSchema, EMPTY);
  const isFavorite = (ocid: string) => favorites.some((f) => f.ocid === ocid);
  return {
    favorites,
    loaded,
    isFavorite,
    toggle: (s: CharacterSummary) =>
      update((current) =>
        current.some((f) => f.ocid === s.ocid) ? current.filter((f) => f.ocid !== s.ocid) : [...current, toFavorite(s)],
      ),
    remove: (ocid: string) => update((current) => current.filter((f) => f.ocid !== ocid)),
  };
}
