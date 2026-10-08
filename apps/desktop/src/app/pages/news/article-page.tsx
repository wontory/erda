import { NEWS_META, isOngoing, periodCaption, type NewsEntry } from "@erda/core";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Newspaper } from "lucide-react";
import { useEffect } from "react";

import { useNav } from "#/app/nav/context.ts";
import { NewsDetail } from "#/app/pages/news/parts/news-detail.tsx";
import { NewsTile } from "#/app/pages/news/parts/news-tile.tsx";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useNow } from "#/features/boss/use-now.ts";
import { noticesCommands } from "#/features/news/commands.ts";
import { useNotices } from "#/features/news/use-notices.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

function Article({ entry, now }: { entry: NewsEntry; now: Date }) {
  return (
    <Module>
      <div className="flex items-start gap-2.5">
        <NewsTile category={entry.category} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[14px] leading-snug font-semibold">{entry.title}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
            <span>{periodCaption(entry)}</span>
            {isOngoing(entry, now) ? <span className="font-medium text-success">진행 중</span> : null}
          </div>
        </div>
      </div>
      <NewsDetail entry={entry} />
    </Module>
  );
}

export function ArticlePage({ entryId }: { entryId: string }) {
  const { pop } = useNav();
  const news = useNotices();
  const now = useNow();
  const entry = news.entries.find((e) => e.id === entryId);
  const unread = entry !== undefined && !news.seenSet.has(entry.id);
  useEffect(() => {
    if (unread) void runAction(() => noticesCommands.markSeen([entryId]), "읽음으로 표시하지 못했어요");
  }, [unread, entryId]);
  return (
    <>
      <ScreenHeader
        title={entry ? NEWS_META[entry.category].title : "소식"}
        onBack={pop}
        onSettings={() => void openSettingsAction()}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {entry ? (
          <Article entry={entry} now={now} />
        ) : !news.loaded || news.loading ? (
          <LoadingRow label="소식 불러오는 중…" />
        ) : (
          <Module>
            <EmptyState icon={Newspaper} title="글을 찾을 수 없어요" description="목록에서 내려간 글이에요" />
          </Module>
        )}
      </div>
    </>
  );
}
