import { Module } from "@erda/ui/components/module";
import { Badge } from "@erda/ui/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@erda/ui/components/ui/context-menu";
import { ScrollArea } from "@erda/ui/components/ui/scroll-area";
import { WorldIcon } from "@erda/ui/components/world-icon";
import { DURATION, EASE_SNAPPY, fadeScale } from "@erda/ui/lib/motion";
import { Star } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { useFavorites } from "#/features/character/use-favorites.ts";
import { runAction } from "#/lib/action.ts";

const chip = {
  ...fadeScale,
  exit: { opacity: 0, scale: 0.9, transition: { duration: DURATION.fast, ease: EASE_SNAPPY } },
};

export function FavoritesModule({ onOpen, limit }: { onOpen: (ocid: string, name: string) => void; limit?: number }) {
  const { favorites, remove } = useFavorites();
  if (favorites.length === 0) return null;
  const shown = limit === undefined ? favorites : favorites.slice(0, limit);
  return (
    <Module title="즐겨찾기" icon={Star}>
      <ScrollArea orientation="horizontal">
        <div className="flex w-max gap-1.5 in-data-has-overflow-x:pb-2">
          <AnimatePresence initial={false}>
            {shown.map((f) => (
              <m.div key={f.ocid} {...chip} className="shrink-0">
                <ContextMenu>
                  <ContextMenuTrigger render={<span />}>
                    <Badge
                      variant="outline"
                      render={(props) => <button type="button" {...props} />}
                      onClick={() => onOpen(f.ocid, f.name)}
                      className="h-6 max-w-40 hover:bg-muted"
                      title={f.name}
                    >
                      <WorldIcon world={f.world} size={12} />
                      <span className="truncate">{f.name}</span>
                    </Badge>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => runAction(() => remove(f.ocid), "즐겨찾기에서 제거하지 못했어요")}>
                      즐겨찾기에서 제거
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Module>
  );
}
