import { getCharacterLinkSkill } from "@erda/api/generated/endpoints/character/character";
import { matchingPreset } from "@erda/core";
import { Link2 } from "lucide-react";
import { useState } from "react";

import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { Section } from "./section.tsx";
import { SkillRow } from "./skill-section.tsx";

export function LinkSkillSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section
      id="linkSkill"
      ocid={ocid}
      icon={Link2}
      fetcher={(p) => getCharacterLinkSkill({ ocid }, { nexonCache: p })}
      isEmpty={(d) => (d.character_link_skill ?? []).length === 0 && !d.character_owned_link_skill?.skill_name}
    >
      {(d) => {
        const presets = [
          d.character_link_skill_preset_1,
          d.character_link_skill_preset_2,
          d.character_link_skill_preset_3,
        ];
        const current = matchingPreset(d.character_link_skill, presets, (s) => `${s.skill_name}:${s.skill_level}`);
        const { active, worn } = resolvePreset(preset, current);
        const skills = (worn ? d.character_link_skill : presetAt(active, presets)) ?? [];
        const owned = worn
          ? d.character_owned_link_skill
          : presetAt(active, [
              d.character_owned_link_skill_preset_1,
              d.character_owned_link_skill_preset_2,
              d.character_owned_link_skill_preset_3,
            ]);
        return (
          <>
            <PresetPicker count={3} value={active} current={current} onChange={setPreset} />
            {owned?.skill_name ? (
              <div className="px-2 text-[11px] text-muted-foreground">
                보유 링크 {owned.skill_name} Lv.{owned.skill_level}
              </div>
            ) : null}
            {skills.map((s) => (
              <SkillRow
                key={s.skill_name}
                icon={s.skill_icon}
                name={s.skill_name}
                level={s.skill_level}
                effect={s.skill_effect}
              />
            ))}
          </>
        );
      }}
    </Section>
  );
}
