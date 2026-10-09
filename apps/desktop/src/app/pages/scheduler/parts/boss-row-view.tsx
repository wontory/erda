import { KoreanNumber, type BossRow } from "@erda/core";
import { CheckCircle } from "@erda/ui/components/check-circle";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { cn } from "@erda/ui/lib/utils";

import { DifficultyTile } from "./difficulty-tile.tsx";

export const BOSS_LIST_LOADING_HEIGHT = 258;

export function BossRowView({ row, onToggle, dimmed }: { row: BossRow; onToggle?: () => void; dimmed?: boolean }) {
  const subtitle = row.party > 1 ? `${row.difficulty} · ${row.party}인` : row.difficulty;
  return (
    <Item size="row">
      <ItemMedia>
        <span className="flex items-center gap-2">
          <CheckCircle
            checked={row.cleared}
            label={`${row.name} ${row.difficulty}`}
            onChange={onToggle ? () => onToggle() : undefined}
          />
          <DifficultyTile difficulty={row.difficulty} />
        </span>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>
          <span className={cn((row.cleared || dimmed) && "text-muted-foreground", row.cleared && "line-through")}>
            {row.name}
          </span>
        </ItemTitle>
        <ItemDescription>{subtitle}</ItemDescription>
      </ItemContent>
      <ItemActions className="min-w-0 shrink text-muted-foreground">
        <span className="truncate">
          {row.inCatalog ? (
            <span className="tabular-nums">{KoreanNumber.format(row.revenue)}</span>
          ) : (
            <span className="text-[11px]">가격표에 없음</span>
          )}
        </span>
      </ItemActions>
    </Item>
  );
}
