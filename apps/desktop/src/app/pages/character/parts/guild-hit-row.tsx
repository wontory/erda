import type { GuildHit } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { WorldIcon } from "@erda/ui/components/world-icon";
import { ChevronRight, Flag } from "lucide-react";

export function GuildHitRow({ hit, onClick }: { hit: GuildHit; onClick: () => void }) {
  return (
    <Item size="row" render={(props) => <button type="button" {...props} />} onClick={onClick}>
      <ItemMedia>
        <span className="inline-flex w-10 justify-center">
          <IconTile icon={Flag} color="bg-teal-500" size={28} />
        </span>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{hit.name}</ItemTitle>
        <ItemDescription>
          <span className="inline-flex items-center gap-1">
            <WorldIcon world={hit.world} size={12} alt="" />
            {hit.world}
            {hit.level ? ` · Lv.${hit.level}` : ""}
            {hit.master ? ` · 마스터 ${hit.master}` : ""}
          </span>
        </ItemDescription>
      </ItemContent>
      <ChevronRight size={14} className="text-muted-foreground" />
    </Item>
  );
}
