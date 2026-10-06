import { SECTION_META, type CharacterSummary } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { SectionHeader } from "@erda/ui/components/section-header";
import { Trophy } from "lucide-react";

import { useRankings } from "#/features/insights/use-rankings.ts";

import { RankingCardView } from "./ranking-card-view.tsx";

export function RankingSection({ summary }: { summary: CharacterSummary }) {
  const r = useRankings({ ocid: summary.ocid, name: summary.name, world: summary.world });
  const meta = SECTION_META.ranking;
  return (
    <Module>
      <SectionHeader title={meta.title} color={meta.color} icon={Trophy} />
      {r.cards.map((c) => (
        <RankingCardView key={c.id} card={c} />
      ))}
      <div className="px-2 pt-1 text-[11px] text-muted-foreground">랭킹은 매일 오전에 전날 기준으로 갱신돼요</div>
    </Module>
  );
}
