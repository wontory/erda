import { isMaintenance, isOngoing, periodCaption, type NewsEntry } from "@erda/core";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@erda/ui/components/ui/collapsible";
import { cn } from "@erda/ui/lib/utils";
import { useState } from "react";

import { NewsDetail } from "./news-detail.tsx";
import { NewsTile } from "./news-tile.tsx";

export function NewsRow({
  entry,
  unread,
  now,
  onOpen,
  banner,
}: {
  entry: NewsEntry;
  unread: boolean;
  now: Date;
  onOpen: (id: string) => void;
  banner?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hadDot, setHadDot] = useState(unread);
  if (unread && !hadDot) setHadDot(true);
  const maintenance = isMaintenance(entry.title);
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && unread) onOpen(entry.id);
  };
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg transition-colors duration-100 ease-out hover:bg-glass-card-hover"
    >
      <CollapsibleTrigger className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <NewsTile category={entry.category} maintenance={banner} />
        <span className="min-w-0 flex-1">
          <span className={cn("block leading-snug font-semibold", !open && "line-clamp-2")}>
            {hadDot ? (
              <span
                aria-hidden
                className={cn(
                  "mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle transition-[opacity,scale] duration-200 ease-out",
                  !unread && "scale-0 opacity-0",
                )}
              />
            ) : null}
            {unread ? <span className="sr-only">안 읽음</span> : null}
            {entry.title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
            <span>{periodCaption(entry)}</span>
            {isOngoing(entry, now) ? <span className="font-medium text-success">진행 중</span> : null}
            {maintenance && !banner ? (
              <span className="rounded bg-warning/10 px-1 font-medium text-warning">점검</span>
            ) : null}
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 pb-2">
          <NewsDetail entry={entry} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
