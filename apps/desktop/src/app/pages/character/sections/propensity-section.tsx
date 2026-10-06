import { getCharacterPropensity } from "@erda/api/generated/endpoints/character/character";
import { PropensityRadar } from "@erda/ui/components/propensity-radar";
import { Compass } from "lucide-react";

import { Section } from "./section.tsx";

const LABELS = ["카리스마", "감성", "통찰력", "의지", "손재주", "매력"];

export function PropensitySection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="propensity"
      ocid={ocid}
      icon={Compass}
      fetcher={(p) => getCharacterPropensity({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const values = [
          d.charisma_level,
          d.sensibility_level,
          d.insight_level,
          d.willingness_level,
          d.handicraft_level,
          d.charm_level,
        ].map((v) => v ?? 0);
        const total = values.reduce((a, b) => a + b, 0);
        return (
          <>
            <div className="px-2 text-[12px] text-muted-foreground">합계 {total} / 600</div>
            <div className="flex justify-center">
              <PropensityRadar values={values} labels={LABELS} />
            </div>
          </>
        );
      }}
    </Section>
  );
}
