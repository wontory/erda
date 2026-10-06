import { HISTORY_KINDS, HISTORY_META, rootSummary } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Module } from "@erda/ui/components/module";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { cn } from "@erda/ui/lib/utils";

import { useNav } from "#/app/nav/context.ts";
import { pages } from "#/app/nav/stack.ts";
import { LinkRow } from "#/app/pages/shared/link-row.tsx";
import { useStoredMainOcid } from "#/features/character/use-main-character.ts";
import { useHistorySummaries } from "#/features/insights/history-store.ts";
import { historyIcon, INSIGHT_ICONS } from "#/features/insights/icons.ts";
import { useCachedAchievementRank } from "#/features/insights/use-achievement-rank.ts";
import { useCachedAchievements } from "#/features/insights/use-achievements.ts";
import { useCallsToday } from "#/features/insights/use-calls-today.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

const count = (n: number) => n.toLocaleString("en-US");

function useAchievementValue() {
  const achievements = useCachedAchievements();
  const mainOcid = useStoredMainOcid();
  const rank = useCachedAchievementRank(mainOcid);
  return [achievements ? `${achievements.length}개` : null, rank?.grade || null, rank ? `${count(rank.score)}점` : null]
    .filter(Boolean)
    .join(" · ");
}

function CallsToday({ onBudget }: { onBudget: () => void }) {
  const calls = useCallsToday();
  return (
    <div className="flex items-center justify-between px-1">
      <span className={cn("text-[12px] tabular-nums", calls.over ? "text-warning" : "text-muted-foreground")}>
        오늘 호출 {calls.calls === null ? "—" : count(calls.calls)} / {count(calls.budget)}회
      </span>
      <Button variant="ghost" size="xs" onClick={onBudget}>
        예산 설정
      </Button>
    </div>
  );
}

export function AccountPage() {
  const { pop, push } = useNav();
  const summaries = useHistorySummaries();
  const achievementValue = useAchievementValue();
  const openGeneral = () => openSettingsAction("general");
  return (
    <>
      <ScreenHeader title="내 계정" onBack={pop} onSettings={openGeneral} />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <CallsToday onBudget={openGeneral} />
        <Module title="강화 기록">
          {HISTORY_KINDS.map((k) => (
            <LinkRow
              key={k}
              media={<IconTile icon={historyIcon(k)} color={HISTORY_META[k].color} size={22} />}
              title={HISTORY_META[k].title}
              value={rootSummary(summaries[k].aggregate, summaries[k].state)}
              onClick={() => push(pages.history(k))}
            />
          ))}
        </Module>
        <Module>
          <LinkRow
            media={<IconTile icon={INSIGHT_ICONS.achievements} color="bg-green-500" size={22} />}
            title="업적"
            value={achievementValue}
            onClick={() => push(pages.achievements())}
          />
        </Module>
      </div>
    </>
  );
}
