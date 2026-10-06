import { getCharacterVmatrix } from "@erda/api/generated/endpoints/character/character";
import { matchingPreset } from "@erda/core";
import { Grid3x3 } from "lucide-react";
import { useState } from "react";

import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

function groupByType<T extends { v_core_type?: string | null }>(cores: T[]) {
  const groups = new Map<string, T[]>();
  for (const c of cores) groups.set(c.v_core_type ?? "", [...(groups.get(c.v_core_type ?? "") ?? []), c]);
  return [...groups.entries()].toSorted(([a], [b]) => a.localeCompare(b, "ko"));
}

export function VMatrixSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section
      id="vMatrix"
      ocid={ocid}
      icon={Grid3x3}
      fetcher={(p) => getCharacterVmatrix({ ocid }, { nexonCache: p })}
      isEmpty={(d) => (d.character_v_core_equipment ?? []).length === 0}
    >
      {(d) => {
        const presets = [
          d.character_v_core_equipment_preset_1,
          d.character_v_core_equipment_preset_2,
          d.character_v_core_equipment_preset_3,
          d.character_v_core_equipment_preset_4,
          d.character_v_core_equipment_preset_5,
        ];
        const current = matchingPreset(
          d.character_v_core_equipment,
          presets,
          (c) => `${c.v_core_name}:${c.v_core_level}`,
        );
        const { active, worn } = resolvePreset(preset, current);
        const cores = (worn ? d.character_v_core_equipment : presetAt(active, presets)) ?? [];
        return (
          <>
            <PresetPicker count={5} value={active} current={current} onChange={setPreset} />
            <ValueRow label="남은 슬롯 강화 포인트" value={d.character_v_matrix_remain_slot_upgrade_point ?? 0} />
            {groupByType(cores).map(([type, cs]) => (
              <div key={type} className="mb-1">
                <SubHeading>{type}</SubHeading>
                {cs.map((c, i) => (
                  <ValueRow key={`${c.v_core_name}-${i}`} label={c.v_core_name} value={`Lv.${c.v_core_level}`} />
                ))}
              </div>
            ))}
          </>
        );
      }}
    </Section>
  );
}
