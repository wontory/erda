import { getCharacterOtherStat } from "@erda/api/generated/endpoints/character/character";
import { ListTree } from "lucide-react";

import { SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

export function OtherStatSection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="otherStat"
      ocid={ocid}
      icon={ListTree}
      fetcher={(p) => getCharacterOtherStat({ ocid }, { nexonCache: p })}
      isEmpty={(d) => (d.other_stat ?? []).length === 0}
    >
      {(d) => (
        <>
          {(d.other_stat ?? []).map((g) => (
            <div key={g.other_stat_type} className="mb-2">
              <SubHeading>{g.other_stat_type}</SubHeading>
              {(g.stat_info ?? []).map((s) => (
                <ValueRow key={s.stat_name} label={s.stat_name} value={s.stat_value} />
              ))}
            </div>
          ))}
        </>
      )}
    </Section>
  );
}
