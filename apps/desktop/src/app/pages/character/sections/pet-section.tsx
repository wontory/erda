import { getCharacterPetEquipment } from "@erda/api/generated/endpoints/character/character";
import type {
  CharacterPetEquipment,
  CharacterPetEquipmentPet1AutoSkill,
  CharacterPetEquipmentPet1Equipment,
} from "@erda/api/generated/model";
import { TimeFormat } from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { PawPrint } from "lucide-react";

import { SectionNote } from "./section-text.tsx";
import { Section } from "./section.tsx";

type Pet = {
  name: string | null;
  nickname: string | null;
  icon: string | null;
  expire: string | null;
  equipment: CharacterPetEquipmentPet1Equipment | null;
  auto: CharacterPetEquipmentPet1AutoSkill | null;
  skills: string[];
};

function petsOf(d: CharacterPetEquipment): Pet[] {
  return [1, 2, 3]
    .map((n) => {
      const g = (k: string) => (d as Record<string, unknown>)[`pet_${n}_${k}`];
      return {
        name: g("name") as string | null,
        nickname: g("nickname") as string | null,
        icon: g("icon") as string | null,
        expire: g("date_expire") as string | null,
        equipment: g("equipment") as CharacterPetEquipmentPet1Equipment | null,
        auto: g("auto_skill") as CharacterPetEquipmentPet1AutoSkill | null,
        skills: (g("skill") as string[] | null) ?? [],
      };
    })
    .filter((p) => p.name);
}

function PetRow({ pet: p }: { pet: Pet }) {
  return (
    <div className="flex items-start gap-2.5 px-2 py-1">
      <GameIcon src={p.icon} size={32} />
      <div className="min-w-0 text-[12px]">
        <div className="font-semibold">
          {p.name}
          {p.nickname ? ` (${p.nickname})` : ""}{" "}
          {p.expire ? (
            <span className="font-normal text-muted-foreground">~{TimeFormat.shortDate(p.expire)}</span>
          ) : null}
        </div>
        {p.equipment?.item_name ? <div className="text-muted-foreground">장비: {p.equipment.item_name}</div> : null}
        {p.auto?.skill_1 || p.auto?.skill_2 ? (
          <div className="text-muted-foreground">
            자동 스킬: {[p.auto?.skill_1, p.auto?.skill_2].filter(Boolean).join(", ")}
          </div>
        ) : null}
        {p.skills.length ? <div className="text-muted-foreground">{p.skills.join(" · ")}</div> : null}
      </div>
    </div>
  );
}

export function PetSection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="pet"
      ocid={ocid}
      icon={PawPrint}
      fetcher={(p) => getCharacterPetEquipment({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const pets = petsOf(d);
        if (pets.length === 0) return <SectionNote>펫 없음</SectionNote>;
        return (
          <>
            {pets.map((p) => (
              <PetRow key={p.name} pet={p} />
            ))}
          </>
        );
      }}
    </Section>
  );
}
