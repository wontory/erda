import { getCharacterItemEquipment } from "@erda/api/generated/endpoints/character/character";
import { starforceCandidate, type StarforceCandidate } from "@erda/core";
import { useMemo } from "react";

import { useExtra } from "#/features/character/use-extra.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";

export function useEquippedCandidates() {
  const main = useMainCharacter();
  const ocid = main.ocid ?? "";
  const equipment = useExtra("equipment", ocid, (p) => getCharacterItemEquipment({ ocid }, { nexonCache: p }), {
    enabled: !!main.ocid,
  });
  const candidates = useMemo(
    () =>
      (equipment.data?.item_equipment ?? []).map(starforceCandidate).filter((c): c is StarforceCandidate => c !== null),
    [equipment.data],
  );
  return {
    owner: main.summary?.name ?? (main.name || null),
    candidates,
    isPending: main.isPending || (!!main.ocid && equipment.isPending),
    error: main.error ?? equipment.error ?? null,
  };
}
