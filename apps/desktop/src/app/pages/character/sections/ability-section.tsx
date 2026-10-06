import { getCharacterAbility } from "@erda/api/generated/endpoints/character/character";
import { gradeColorClass, presetNo } from "@erda/core";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { Section } from "./section.tsx";

const GRADE_BG: Record<string, string> = {
  레전드리: "bg-grade-legendary",
  유니크: "bg-grade-unique",
  에픽: "bg-grade-epic",
  레어: "bg-grade-rare",
};

function GradeDot({ grade }: { grade: string | null | undefined }) {
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${(grade && GRADE_BG[grade]) || "bg-muted-foreground"}`}
    >
      <span className="sr-only">{grade ?? "등급 없음"}</span>
    </span>
  );
}

export function AbilitySection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section id="ability" ocid={ocid} icon={Sparkles} fetcher={(p) => getCharacterAbility({ ocid }, { nexonCache: p })}>
      {(d) => {
        const current = presetNo(d.preset_no, 3);
        const { active, worn } = resolvePreset(preset, current);
        const picked = presetAt(active, [d.ability_preset_1, d.ability_preset_2, d.ability_preset_3]);
        const chosen = worn
          ? { grade: d.ability_grade, info: d.ability_info }
          : { grade: picked?.ability_preset_grade, info: picked?.ability_info };
        return (
          <>
            <PresetPicker count={3} value={active} current={current} onChange={setPreset} />
            <div className={`px-2 text-[12px] font-semibold ${gradeColorClass(chosen.grade)}`}>
              {chosen.grade ?? "-"}
            </div>
            {(chosen.info ?? []).map((a) => (
              <div key={a.ability_no} className="flex items-center gap-2 px-2 py-1 text-[12px]">
                <GradeDot grade={a.ability_grade} />
                <span>{a.ability_value}</span>
              </div>
            ))}
            <p className="px-2 pt-1 text-[11px] text-muted-foreground">
              남은 명성치 {(d.remain_fame ?? 0).toLocaleString("en-US")}
            </p>
          </>
        );
      }}
    </Section>
  );
}
