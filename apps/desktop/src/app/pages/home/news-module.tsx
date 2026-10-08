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

function MaintenanceBanner({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-2 py-1.5 text-[12px]">
      <MaintenanceIcon size={14} aria-hidden className="shrink-0 text-warning" />
      <span className="truncate font-medium">{title}</span>
    </div>
  );
}

function SundayMapleBanner({ entry }: { entry: NewsEntry }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5 text-[12px]">
      <Sun size={14} aria-hidden className="shrink-0 text-primary" />
      <span className="truncate font-medium">{entry.title}</span>
      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{periodCaption(entry)}</span>
    </div>
  );
}

function NewsPreviewRow({ entry, unread }: { entry: NewsEntry; unread: boolean }) {
  return (
    <div className="flex items-center gap-2">
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
    </div>
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

export function NewsModule({ onOpen }: { onOpen: () => void }) {
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
          {banner ? <MaintenanceBanner title={banner.title} /> : null}
          {sunday ? <SundayMapleBanner entry={sunday} /> : null}
          {top.length === 0 ? (
            <NoPreview news={news} />
          ) : (
            top.map((e) => <NewsPreviewRow key={e.id} entry={e} unread={!news.seenSet.has(e.id)} />)
          )}
        </div>
      )}
    </Module>
  );
}
