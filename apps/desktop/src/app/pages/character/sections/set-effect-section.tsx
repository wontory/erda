import { getCharacterSetEffect } from "@erda/api/generated/endpoints/character/character";
import { Layers } from "lucide-react";

import { Section } from "./section.tsx";

const isActive = (s: { total_set_count?: number | null }) => (s.total_set_count ?? 0) > 0;

export function SetEffectSection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="setEffect"
      ocid={ocid}
      icon={Layers}
      fetcher={(p) => getCharacterSetEffect({ ocid }, { nexonCache: p })}
      isEmpty={(d) => !(d.set_effect ?? []).some(isActive)}
    >
      {(d) => (
        <>
          {(d.set_effect ?? []).filter(isActive).map((s) => (
            <div key={s.set_name} className="mb-2 px-2 text-[12px]">
              <div className="font-semibold">
                {s.set_name} <span className="text-muted-foreground">{s.total_set_count}세트</span>
              </div>
              {(s.set_effect_info ?? []).map((e) => (
                <div key={e.set_count} className="text-muted-foreground">
                  {e.set_count}세트: {e.set_option}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </Section>
  );
}
