import { latest, maintenanceBanner, periodCaption, sundayMaple, type NewsEntry } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { Module } from "@erda/ui/components/module";
import { cn } from "@erda/ui/lib/utils";
import { Newspaper, Sun } from "lucide-react";

import { NewsTile } from "#/app/pages/news/parts/news-tile.tsx";
import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";
import { useNow } from "#/features/boss/use-now.ts";
import { MaintenanceIcon } from "#/features/news/icons.ts";
import { useNotices } from "#/features/news/use-notices.ts";

type Notices = ReturnType<typeof useNotices>;

const ROW_BUTTON =
  "flex w-full items-center gap-2 rounded-lg text-left transition-colors duration-100 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function MaintenanceBanner({ entry, onOpen }: { entry: NewsEntry; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(ROW_BUTTON, "bg-warning/10 px-2 py-1.5 text-[12px] hover:bg-warning/15 active:bg-warning/20")}
    >
      <MaintenanceIcon size={14} aria-hidden className="shrink-0 text-warning" />
      <span className="truncate font-medium">{entry.title}</span>
    </button>
  );
}

function SundayMapleBanner({ entry, onOpen }: { entry: NewsEntry; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(ROW_BUTTON, "bg-primary/10 px-2 py-1.5 text-[12px] hover:bg-primary/15 active:bg-primary/20")}
    >
      <Sun size={14} aria-hidden className="shrink-0 text-primary" />
      <span className="truncate font-medium">{entry.title}</span>
      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{periodCaption(entry)}</span>
    </button>
  );
}

function NewsPreviewRow({ entry, unread, onOpen }: { entry: NewsEntry; unread: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        ROW_BUTTON,
        "-mx-1.5 w-[calc(100%+12px)] px-1.5 py-0.5 hover:bg-foreground/5 active:bg-foreground/10",
      )}
    >
      <NewsTile category={entry.category} size={18} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px]">
          {unread ? (
            <>
              <span aria-hidden className="mr-1 inline-block size-1.5 rounded-full bg-primary align-middle" />
              <span className="sr-only">안 읽음</span>
            </>
          ) : null}
          {entry.title}
        </span>
        <span className="block text-[11px] text-muted-foreground">{periodCaption(entry)}</span>
      </span>
    </button>
  );
}

function NoPreview({ news }: { news: Notices }) {
  if (news.error) return <ErrorRow message={news.error} onRetry={news.retry} />;
  if (news.loading || !news.loaded) return <div className="text-[11px] text-muted-foreground">소식 불러오는 중…</div>;
  return (
    <div className={cn("text-[11px]", news.lastError ? "text-danger" : "text-muted-foreground")}>
      {news.lastError ?? "표시할 글이 없어요"}
    </div>
  );
}

export function NewsModule({ onOpen, onOpenEntry }: { onOpen: () => void; onOpenEntry: (id: string) => void }) {
  const news = useNotices();
  const now = useNow();
  const banner = maintenanceBanner(news.entries, now);
  const sunday = sundayMaple(news.entries, now);
  const top = latest(news.entries, 2, [banner, sunday]);
  return (
    <Module
      title="소식"
      icon={Newspaper}
      onOpen={onOpen}
      trailing={<TrailingText tone={news.unread > 0 ? "text-primary" : undefined}>안 읽음 {news.unread}</TrailingText>}
    >
      {news.keyMissing ? (
        <div className="text-[11px] text-muted-foreground">API 키가 필요해요</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {banner ? <MaintenanceBanner entry={banner} onOpen={() => onOpenEntry(banner.id)} /> : null}
          {sunday ? <SundayMapleBanner entry={sunday} onOpen={() => onOpenEntry(sunday.id)} /> : null}
          {top.length === 0 ? (
            <NoPreview news={news} />
          ) : (
            top.map((e) => (
              <NewsPreviewRow key={e.id} entry={e} unread={!news.seenSet.has(e.id)} onOpen={() => onOpenEntry(e.id)} />
            ))
          )}
        </div>
      )}
    </Module>
  );
}
