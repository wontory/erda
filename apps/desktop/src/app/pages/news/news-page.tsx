import {
  NEWS_CATEGORIES,
  NEWS_META,
  TimeFormat,
  feedEntries,
  maintenanceBanner,
  sundayMaple,
  unreadCount,
  type NewsEntry,
} from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { KeyRound, Newspaper, Sun, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { pages } from "#/app/nav/stack.ts";
import { FilterMenu, type NewsFilter } from "#/app/pages/news/parts/filter-menu.tsx";
import { NewsRow } from "#/app/pages/news/parts/news-row.tsx";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useNow } from "#/features/boss/use-now.ts";
import { noticesCommands } from "#/features/news/commands.ts";
import { useNotices } from "#/features/news/use-notices.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

type Notices = ReturnType<typeof useNotices>;

const MARK_SEEN_FAILED = "읽음으로 표시하지 못했어요";

function KeyMissing() {
  return (
    <Module>
      <EmptyState
        icon={KeyRound}
        title="API 키가 필요해요"
        description="설정 › 일반에서 넥슨 Open API 키를 넣어 주세요"
        action={
          <Button size="sm" variant="outline" onClick={() => void openSettingsAction("general")}>
            설정 열기
          </Button>
        }
      />
    </Module>
  );
}

function FeedFallback({ news, onRefresh }: { news: Notices; onRefresh: () => void }) {
  if (news.error) return <ErrorRow message={news.error} onRetry={news.retry} />;
  if (!news.loaded || news.loading) return <LoadingRow label="소식 불러오는 중…" />;
  if (news.lastError) return <ErrorRow message={news.lastError} onRetry={onRefresh} />;
  return <EmptyState icon={Newspaper} title="표시할 글이 없어요" />;
}

function FeedFooter({
  error,
  updatedAt,
  now,
}: {
  error: Notices["lastError"];
  updatedAt: Notices["updatedAt"];
  now: Date;
}) {
  return (
    <div className={error ? "px-1 text-[11px] text-danger" : "px-1 text-[11px] text-muted-foreground"}>
      {error
        ? error
        : updatedAt
          ? `${TimeFormat.relative(new Date(updatedAt), now)} 갱신 · 10분마다 자동 확인`
          : "10분마다 자동 확인"}
    </div>
  );
}

export function NewsPage() {
  const { pop, push } = useNav();
  const news = useNotices();
  const now = useNow();
  const [filter, setFilter] = useState<NewsFilter>("all");
  useEffect(() => {
    noticesCommands.refresh(false).catch((e) => console.error("notices_refresh failed", e));
  }, []);
  const banner = useMemo(() => maintenanceBanner(news.entries, now), [news.entries, now]);
  const sunday = useMemo(() => sundayMaple(news.entries, now), [news.entries, now]);
  const feed = useMemo(
    () => feedEntries(news.entries, filter, [banner, sunday]),
    [news.entries, filter, banner, sunday],
  );
  const visibleUnread = unreadCount(news.entries, news.seenSet, filter);
  const errorInFeed = feed.length === 0 && (!!news.error || (news.loaded && !news.loading && !!news.lastError));
  const footerError = errorInFeed ? null : news.lastError;
  const isUnread = (e: NewsEntry) => !news.seenSet.has(e.id);
  const openArticle = (id: string) => push(pages.article(id));
  const markAll = () =>
    void runAction(() => noticesCommands.markAllSeen(filter === "all" ? NEWS_CATEGORIES : [filter]), MARK_SEEN_FAILED);
  const refresh = () => void runAction(() => noticesCommands.refresh(true), "소식을 갱신하지 못했어요");
  const trailing = (
    <>
      <FilterMenu value={filter} onChange={setFilter} entries={news.entries} seen={news.seenSet} />
      <RefreshButton onClick={refresh} loading={news.loading} disabled={!news.keySet} />
    </>
  );
  return (
    <>
      <ScreenHeader title="소식" onBack={pop} trailing={trailing} onSettings={() => void openSettingsAction()} />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {news.keyMissing ? (
          <KeyMissing />
        ) : (
          <>
            {banner && (filter === "all" || filter === "notice") ? (
              <Module title="점검 공지" icon={Wrench}>
                <NewsRow entry={banner} unread={isUnread(banner)} now={now} onOpen={openArticle} banner />
              </Module>
            ) : null}
            {sunday && (filter === "all" || filter === "event") ? (
              <Module title="썬데이 메이플" icon={Sun}>
                <NewsRow entry={sunday} unread={isUnread(sunday)} now={now} onOpen={openArticle} />
              </Module>
            ) : null}
            <Module
              title={filter === "all" ? "전체" : NEWS_META[filter].title}
              icon={Newspaper}
              trailing={
                <Button variant="ghost" size="xs" disabled={visibleUnread === 0} onClick={markAll}>
                  모두 읽음으로 표시
                </Button>
              }
            >
              {feed.length > 0 ? (
                feed.map((e) => <NewsRow key={e.id} entry={e} unread={isUnread(e)} now={now} onOpen={openArticle} />)
              ) : (
                <FeedFallback news={news} onRefresh={refresh} />
              )}
            </Module>
            <FeedFooter error={footerError} updatedAt={news.updatedAt} now={now} />
          </>
        )}
      </div>
    </>
  );
}
