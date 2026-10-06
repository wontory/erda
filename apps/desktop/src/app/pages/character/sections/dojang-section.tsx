import { getCharacterDojang } from "@erda/api/generated/endpoints/character/character";
import { TimeFormat } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { Swords } from "lucide-react";

import { nullIfNotFound } from "#/features/character/queries.ts";

import { Section } from "./section.tsx";

export function DojangSection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="dojang"
      ocid={ocid}
      icon={Swords}
      fetcher={(p) => getCharacterDojang({ ocid }, { nexonCache: p }).catch(nullIfNotFound)}
    >
      {(dojang) => {
        const best = dojang?.dojang_best_floor ? dojang : null;
        return (
          <div className="grid grid-cols-3 gap-3">
            <Metric title="최고 층" value={best ? `${best.dojang_best_floor}층` : "-"} tint="text-primary" />
            <Metric title="시간" value={best ? TimeFormat.clock(best.dojang_best_time ?? 0) : "-"} />
            <Metric title="날짜" value={best ? TimeFormat.shortDate(best.date_dojang_record) : "-"} />
          </div>
        );
      }}
    </Section>
  );
}
