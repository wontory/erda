import { getCharacterHexamatrix, getCharacterHexamatrixStat } from "@erda/api/generated/endpoints/character/character";
import type { CharacterHexaMatrixCharacterHexaCoreEquipmentItem } from "@erda/api/generated/model";
import { groupHexaCores } from "@erda/core";
import { Progress } from "@erda/ui/components/ui/progress";
import { Hexagon } from "lucide-react";

import { nullIfNotFound } from "#/features/character/queries.ts";
import { useExtra } from "#/features/character/use-extra.ts";

import { SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

function useHexaStatCores(ocid: string) {
  const stat = useExtra("hexaStat", ocid, (p) =>
    getCharacterHexamatrixStat({ ocid }, { nexonCache: p }).catch(nullIfNotFound),
  );
  return [
    stat.data?.character_hexa_stat_core,
    stat.data?.character_hexa_stat_core_2,
    stat.data?.character_hexa_stat_core_3,
  ]
    .map((c) => c?.[0])
    .filter((c) => c !== undefined && c !== null);
}

function CoreLevel({ core }: { core: CharacterHexaMatrixCharacterHexaCoreEquipmentItem }) {
  return (
    <div className="px-2 py-1 text-[12px]">
      <div className="flex justify-between">
        <span className="truncate">{core.hexa_core_name}</span>
        <span className="tabular-nums">Lv.{core.hexa_core_level}</span>
      </div>
      <Progress
        value={core.hexa_core_level ?? 0}
        max={30}
        className="mt-1 [&_[data-slot=progress-indicator]]:bg-fuchsia-500"
        aria-label={`${core.hexa_core_name} 레벨`}
      />
    </div>
  );
}

export function HexaSection({ ocid }: { ocid: string }) {
  const cores = useHexaStatCores(ocid);
  return (
    <Section
      id="hexa"
      ocid={ocid}
      icon={Hexagon}
      fetcher={(p) => getCharacterHexamatrix({ ocid }, { nexonCache: p })}
      isEmpty={(d) => (d.character_hexa_core_equipment ?? []).length === 0 && cores.length === 0}
    >
      {(d) => (
        <>
          {groupHexaCores(d.character_hexa_core_equipment ?? []).map((g) => (
            <div key={g.type} className="mb-2">
              <SubHeading>
                {g.type} {g.cores.length}개
              </SubHeading>
              {g.cores.map((c) => (
                <CoreLevel key={c.hexa_core_name} core={c} />
              ))}
            </div>
          ))}
          {cores.length > 0 ? (
            <div className="mt-1">
              <SubHeading>HEXA 스탯</SubHeading>
              {cores.map((c, i) => (
                <ValueRow
                  key={i}
                  label={`코어 ${i + 1} · ${c.main_stat_name} Lv.${c.main_stat_level}`}
                  value={`${c.sub_stat_name_1} Lv.${c.sub_stat_level_1} · ${c.sub_stat_name_2} Lv.${c.sub_stat_level_2} · ${c.stat_grade}단계`}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}
