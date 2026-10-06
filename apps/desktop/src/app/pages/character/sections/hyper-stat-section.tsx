import { getCharacterHyperStat } from "@erda/api/generated/endpoints/character/character";
import { presetNo } from "@erda/core";
import { Zap } from "lucide-react";
import { useState } from "react";

import { PresetPicker } from "./preset-picker.tsx";
import { presetAt, resolvePreset } from "./preset.ts";
import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

const count = (n: number) => n.toLocaleString("en-US");

export function HyperStatSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section id="hyperStat" ocid={ocid} icon={Zap} fetcher={(p) => getCharacterHyperStat({ ocid }, { nexonCache: p })}>
      {(d) => {
        const current = presetNo(d.use_preset_no, 3);
        const { active } = resolvePreset(preset, current);
        const stats = presetAt(active, [d.hyper_stat_preset_1, d.hyper_stat_preset_2, d.hyper_stat_preset_3]) ?? [];
        const remain = presetAt(active, [
          d.hyper_stat_preset_1_remain_point,
          d.hyper_stat_preset_2_remain_point,
          d.hyper_stat_preset_3_remain_point,
        ]);
        const available = d.use_available_hyper_stat ?? 0;
        const used = available - (remain ?? 0);
        return (
          <>
            <PresetPicker
              count={3}
              value={active}
              current={current}
              label={(n) => `프리셋 ${n}`}
              onChange={setPreset}
            />
            <ValueRow label="포인트" value={`${count(used)} / ${count(available)} · 남은 ${remain ?? 0}`} />
            {stats
              .filter((s) => (s.stat_level ?? 0) > 0)
              .map((s) => (
                <ValueRow
                  key={s.stat_type}
                  label={s.stat_type}
                  value={
                    <span>
                      {s.stat_increase} <span className="text-foreground">Lv.{s.stat_level}</span>
                    </span>
                  }
                />
              ))}
          </>
        );
      }}
    </Section>
  );
}
