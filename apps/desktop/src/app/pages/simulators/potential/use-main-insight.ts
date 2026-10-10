import { getCharacterPropensity } from "@erda/api/generated/endpoints/character/character";

import { useExtra } from "#/features/character/use-extra.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";

export function useMainInsight(): number {
  const main = useMainCharacter();
  const ocid = main.ocid ?? "";
  const propensity = useExtra("propensity", ocid, (p) => getCharacterPropensity({ ocid }, { nexonCache: p }), {
    enabled: !!main.ocid,
  });
  return propensity.data?.insight_level ?? 0;
}
