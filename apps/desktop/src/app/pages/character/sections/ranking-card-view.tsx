import { RANKING_META, type RankingCard, type RankingCardId } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { cn } from "@erda/ui/lib/utils";
import { Award, Medal, Shield, Sprout, Swords, Users, type LucideIcon } from "lucide-react";

const ICONS: Record<RankingCardId, LucideIcon> = {
  overall: Medal,
  union: Users,
  dojang: Swords,
  theseed: Sprout,
  achievement: Award,
  guild: Shield,
};

export function RankingCardView({ card }: { card: RankingCard & { loading?: boolean } }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
      <IconTile icon={ICONS[card.id]} color={RANKING_META[card.id].color} size={26} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold">{card.title}</span>
          {card.rank !== null ? (
            <span className="font-semibold text-primary tabular-nums">#{card.rank.toLocaleString("en-US")}</span>
          ) : null}
        </div>
        <div className={cn("truncate text-[12px]", card.status === "error" ? "text-destructive" : "")}>
          {card.loading ? "불러오는 중…" : card.detail}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{card.sub}</div>
      </div>
    </div>
  );
}
