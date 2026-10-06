import { DETAIL_PAGES, type DetailPage } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Module } from "@erda/ui/components/module";
import { BarChart3, Shield, Shirt, Sparkles, Trophy, Users } from "lucide-react";

import { LinkRow } from "#/app/pages/shared/link-row.tsx";
import { useCachedFirstRanking } from "#/features/insights/use-rankings.ts";

const ICONS = {
  stats: BarChart3,
  equipment: Shield,
  appearance: Shirt,
  skills: Sparkles,
  records: Trophy,
  union: Users,
} as const;

export function DetailRowsModule({
  ocid,
  onOpen,
  values,
}: {
  ocid: string;
  onOpen: (page: DetailPage) => void;
  values?: Partial<Record<DetailPage, string>>;
}) {
  const ranking = useCachedFirstRanking(ocid);
  const all = ranking ? { ...values, records: ranking } : values;
  return (
    <Module title="상세">
      {DETAIL_PAGES.map((p) => (
        <LinkRow
          key={p.id}
          media={<IconTile icon={ICONS[p.id]} color={p.color} />}
          title={p.title}
          value={all?.[p.id]}
          onClick={() => onOpen(p.id)}
        />
      ))}
    </Module>
  );
}
