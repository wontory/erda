import { getCharacterAndroidEquipment } from "@erda/api/generated/endpoints/character/character";
import { presetNo } from "@erda/core";
import { Bot } from "lucide-react";
import { useState } from "react";

import { IconRow } from "./icon-row.tsx";
import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { SectionNote } from "./section-text.tsx";
import { Section } from "./section.tsx";

export function AndroidSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section
      id="android"
      ocid={ocid}
      icon={Bot}
      fetcher={(p) => getCharacterAndroidEquipment({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const current = presetNo(d.preset_no, 3);
        const { active, worn } = resolvePreset(preset, current);
        const chosen = worn
          ? d
          : (presetAt(active, [d.android_preset_1, d.android_preset_2, d.android_preset_3]) ?? null);
        const picker = <PresetPicker count={3} value={active} current={current} onChange={setPreset} />;
        if (!chosen?.android_name) {
          return (
            <>
              {picker}
              <SectionNote>안드로이드 없음</SectionNote>
            </>
          );
        }
        return (
          <>
            {picker}
            <IconRow
              icon={chosen.android_icon}
              iconSize={32}
              title={chosen.android_name}
              description={[chosen.android_nickname, chosen.android_grade, chosen.android_gender]
                .filter(Boolean)
                .join(" · ")}
            />
            {worn
              ? (d.android_cash_item_equipment ?? []).map((it, i) => (
                  <IconRow
                    key={i}
                    icon={it.cash_item_icon}
                    iconSize={24}
                    title={it.cash_item_name}
                    description={it.cash_item_equipment_part}
                  />
                ))
              : null}
          </>
        );
      }}
    </Section>
  );
}
