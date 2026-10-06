import { GameIcon } from "@erda/ui/components/game-icon";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import type { ReactNode } from "react";

export function IconRow({
  icon,
  iconSize,
  title,
  description,
  className,
}: {
  icon: string | null | undefined;
  iconSize: number;
  title: ReactNode;
  description: ReactNode;
  className?: string;
}) {
  return (
    <Item size="row" className={className}>
      <ItemMedia>
        <GameIcon src={icon} size={iconSize} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
