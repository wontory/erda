import { isMaintenance, isOngoing, periodCaption, type NewsEntry } from "@erda/core";
import { cn } from "@erda/ui/lib/utils";
import { ChevronRight } from "lucide-react";

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
  const maintenance = isMaintenance(entry.title);
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.id)}
      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-100 ease-out outline-none hover:bg-glass-card-hover focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-foreground/10"
    >
      <NewsTile category={entry.category} maintenance={banner} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block leading-snug font-semibold">
          <span
            aria-hidden
            className={cn("mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle", !unread && "invisible")}
          />
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
      <ChevronRight size={15} aria-hidden className="mt-0.5 shrink-0 self-center text-muted-foreground" />
    </button>
  );
}
