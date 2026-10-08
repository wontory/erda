import { Sprite } from "@erda/ui/components/sprite";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { WorldIcon } from "@erda/ui/components/world-icon";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type CharacterRowProps = {
  name: string;
  world: string;
  job: string;
  image: string;
  level?: number;
  onClick?: () => void;
  trailing?: ReactNode;
};

export function CharacterRow({ name, world, job, image, level, onClick, trailing }: CharacterRowProps) {
  const body = (
    <>
      <ItemMedia>
        <Sprite src={image} size={40} alt="" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        <ItemDescription>
          <span className="inline-flex items-center gap-1">
            <WorldIcon world={world} size={12} alt="" />
            {world}
            {level ? ` · Lv.${level}` : ""} · {job}
          </span>
        </ItemDescription>
      </ItemContent>
    </>
  );
  const actions = trailing ? <ItemActions className="relative">{trailing}</ItemActions> : null;
  if (!onClick) {
    return (
      <Item size="row">
        {body}
        {actions}
      </Item>
    );
  }
  return (
    <Item
      size="row"
      className="relative hover:bg-glass-card-hover has-[>button:active]:bg-[color-mix(in_oklch,var(--glass-card-hover),var(--foreground)_6%)] has-[>button:focus-visible]:ring-[3px] has-[>button:focus-visible]:ring-ring/50"
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 cursor-default items-center gap-2.5 text-left outline-none after:absolute after:inset-0 after:rounded-lg"
      >
        {body}
      </button>
      {actions}
      <ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden />
    </Item>
  );
}
