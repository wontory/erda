import { describeError } from "@erda/api/errors";
import { filterAchievements, type Achievement } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@erda/ui/components/ui/item";
import { Award, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { ItemValue } from "#/app/pages/shared/item-value.tsx";
import { SearchField } from "#/app/pages/shared/search-field.tsx";
import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";
import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { useAchievementRank } from "#/features/insights/use-achievement-rank.ts";
import { useAchievements } from "#/features/insights/use-achievements.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

const PAGE_SIZE = 50;

const count = (n: number) => n.toLocaleString("en-US");

function RankContent() {
  const main = useMainCharacter();
  const decided = main.nameLoaded && !main.isPending;
  const rank = useAchievementRank(main.ocid, main.summary?.name ?? main.name, decided);
  if (!decided || (main.ocid && rank.isLoading)) return <LoadingRow />;
  if (main.error && !main.ocid) return <ErrorRow message={describeError(main.error)} />;
  if (!main.ocid) return <EmptyState icon={Trophy} title="본캐를 정하면 순위가 보여요" />;
  if (rank.error) return <ErrorRow message={describeError(rank.error)} />;
  if (!rank.rank) return <EmptyState icon={Trophy} title="순위 기록이 없어요" />;
  const { grade, score, rank: position } = rank.rank;
  return (
    <Item size="row">
      <ItemContent className="min-w-0">
        <ItemTitle>등급 · 점수 · 순위</ItemTitle>
      </ItemContent>
      <ItemValue>{`${grade} · ${count(score)}점 · #${count(position)}`}</ItemValue>
    </Item>
  );
}

function AchievementList({ shown, limit, onMore }: { shown: Achievement[]; limit: number; onMore: () => void }) {
  return (
    <>
      {shown.slice(0, limit).map((a, i) => (
        <Item
          key={`${a.name}:${i}`}
          size="row"
          className={i >= PAGE_SIZE ? "animate-in duration-150 fade-in" : undefined}
        >
          <ItemContent>
            <ItemTitle>{a.name}</ItemTitle>
            <ItemDescription>{a.description}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
      {shown.length > limit ? (
        <Button variant="outline" className="mt-1 w-full" onClick={onMore}>
          더 보기 ({shown.length - limit}개 남음)
        </Button>
      ) : null}
    </>
  );
}

export function AchievementsPage() {
  const { pop } = useNav();
  const q = useAchievements();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const search = (next: string) => {
    setQuery(next);
    setLimit(PAGE_SIZE);
  };
  const all = useMemo(() => q.data ?? [], [q.data]);
  const shown = useMemo(() => filterAchievements(all, query), [all, query]);
  const header = query.trim() ? `${shown.length} / ${all.length}` : `${all.length}개`;
  return (
    <>
      <ScreenHeader title="업적" onBack={pop} onSettings={() => openSettingsAction()} />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <Module title="업적 순위" icon={Trophy}>
          <RankContent />
        </Module>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = query.trim();
            if (trimmed) search(trimmed);
          }}
        >
          <SearchField value={query} onValueChange={search} label="업적 이름·설명 검색" />
        </form>
        <Module title="달성한 업적" icon={Award} trailing={<TrailingText aria-live="polite">{header}</TrailingText>}>
          {q.isLoading ? (
            <LoadingRow />
          ) : q.error ? (
            <ErrorRow message={describeError(q.error)} onRetry={() => q.refetch()} />
          ) : shown.length === 0 ? (
            <EmptyState icon={Award} title="표시할 업적이 없어요" />
          ) : (
            <AchievementList shown={shown} limit={limit} onMore={() => setLimit((n) => n + PAGE_SIZE)} />
          )}
        </Module>
      </div>
    </>
  );
}
