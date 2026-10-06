import { getUserUnionChampion } from "@erda/api/generated/endpoints/union/union";
import { Item, ItemContent, ItemTitle } from "@erda/ui/components/ui/item";
import { Crown } from "lucide-react";

import { SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";

export function UnionChampionSection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="unionChampion"
      ocid={ocid}
      icon={Crown}
      fetcher={(p) => getUserUnionChampion({ ocid }, { nexonCache: p })}
      isEmpty={(d) => (d.union_champion ?? []).length === 0}
    >
      {(d) => {
        const champions = (d.union_champion ?? []).toSorted((a, b) => (a.champion_slot ?? 0) - (b.champion_slot ?? 0));
        const badgeTotals = d.champion_badge_total_info ?? [];
        return (
          <>
            {champions.map((c) => (
              <div key={c.champion_slot} className="px-2 py-1 text-[12px]">
                <div className="font-semibold">
                  슬롯 {c.champion_slot} · {c.champion_name}
                </div>
                <div className="text-muted-foreground">
                  {c.champion_grade} · {c.champion_class}
                </div>
                {(c.champion_badge_info ?? []).map((b, i) => (
                  <div key={i} className="text-muted-foreground">
                    {b.stat}
                  </div>
                ))}
              </div>
            ))}
            {badgeTotals.length ? (
              <>
                <SubHeading className="mt-1">배지 합계</SubHeading>
                {badgeTotals.map((b, i) => (
                  <Item key={i} size="row">
                    <ItemContent>
                      <ItemTitle>{b.stat}</ItemTitle>
                    </ItemContent>
                  </Item>
                ))}
              </>
            ) : null}
          </>
        );
      }}
    </Section>
  );
}
