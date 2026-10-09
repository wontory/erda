import { describeError } from "@erda/api/errors";
import {
  DETAIL_PAGES,
  PAGE_SECTIONS,
  SECTION_META,
  type CharacterSummary,
  type DetailPage,
  type DetailSectionId,
} from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { SectionHeader } from "@erda/ui/components/section-header";
import { StackItem } from "@erda/ui/components/stack-item";
import { Trophy } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { useNav } from "#/app/nav/context.ts";
import { AbilitySection } from "#/app/pages/character/sections/ability-section.tsx";
import { AndroidSection } from "#/app/pages/character/sections/android-section.tsx";
import { BattleSection } from "#/app/pages/character/sections/battle-section.tsx";
import { BeautySection } from "#/app/pages/character/sections/beauty-section.tsx";
import { CashItemSection } from "#/app/pages/character/sections/cash-item-section.tsx";
import { DojangSection } from "#/app/pages/character/sections/dojang-section.tsx";
import { EquipmentSection } from "#/app/pages/character/sections/equipment-section.tsx";
import { HexaSection } from "#/app/pages/character/sections/hexa-section.tsx";
import { HyperStatSection } from "#/app/pages/character/sections/hyper-stat-section.tsx";
import { LinkSkillSection } from "#/app/pages/character/sections/link-skill-section.tsx";
import { OtherStatSection } from "#/app/pages/character/sections/other-stat-section.tsx";
import { PetSection } from "#/app/pages/character/sections/pet-section.tsx";
import { PropensitySection } from "#/app/pages/character/sections/propensity-section.tsx";
import { RankingSection } from "#/app/pages/character/sections/ranking-section.tsx";
import { RingsSection } from "#/app/pages/character/sections/rings-section.tsx";
import { SetEffectSection } from "#/app/pages/character/sections/set-effect-section.tsx";
import { SkillSection } from "#/app/pages/character/sections/skill-section.tsx";
import { StatsSection } from "#/app/pages/character/sections/stats-section.tsx";
import { SymbolsSection } from "#/app/pages/character/sections/symbols-section.tsx";
import { UnionArtifactSection } from "#/app/pages/character/sections/union-artifact-section.tsx";
import { UnionChampionSection } from "#/app/pages/character/sections/union-champion-section.tsx";
import { UnionRaiderSection } from "#/app/pages/character/sections/union-raider-section.tsx";
import { UnionSummarySection } from "#/app/pages/character/sections/union-summary-section.tsx";
import { VMatrixSection } from "#/app/pages/character/sections/v-matrix-section.tsx";
import { useRefreshing } from "#/app/pages/shared/use-refreshing.ts";
import { useCharacterSummary, useRefreshSummary } from "#/features/character/use-character-summary.ts";
import { useRefreshExtras } from "#/features/character/use-extra.ts";
import { useSkillGrade } from "#/features/character/use-skill-grade.ts";
import { useRefreshBattle } from "#/features/insights/use-battle.ts";
import { useRefreshRankings } from "#/features/insights/use-rankings.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

const COMPANIONS: Partial<Record<DetailSectionId, string[]>> = {
  equipment: ["symbols"],
  hexa: ["hexaStat"],
  unionRaider: ["union"],
};

function PageSections({
  page,
  ocid,
  summary,
  summaryPending,
}: {
  page: DetailPage;
  ocid: string;
  summary: CharacterSummary | undefined;
  summaryPending: boolean;
}) {
  switch (page) {
    case "stats":
      return summary ? (
        <>
          <StatsSection summary={summary} />
          <HyperStatSection ocid={ocid} />
          <AbilitySection ocid={ocid} />
          <OtherStatSection ocid={ocid} />
          <PropensitySection ocid={ocid} />
        </>
      ) : null;
    case "equipment":
      return (
        <>
          <EquipmentSection ocid={ocid} />
          <SymbolsSection ocid={ocid} />
          <SetEffectSection ocid={ocid} />
        </>
      );
    case "appearance":
      return (
        <>
          <CashItemSection ocid={ocid} />
          <BeautySection ocid={ocid} />
          <AndroidSection ocid={ocid} />
          <PetSection ocid={ocid} />
        </>
      );
    case "skills":
      return (
        <>
          <SkillSection ocid={ocid} />
          <HexaSection ocid={ocid} />
          <VMatrixSection ocid={ocid} />
          <LinkSkillSection ocid={ocid} />
          <RingsSection ocid={ocid} />
        </>
      );
    case "records":
      return (
        <>
          {summary ? (
            <RankingSection summary={summary} />
          ) : summaryPending ? (
            <Module>
              <SectionHeader title={SECTION_META.ranking.title} color={SECTION_META.ranking.color} icon={Trophy} />
              <LoadingRow minHeight={360} />
            </Module>
          ) : null}
          <DojangSection ocid={ocid} />
          <BattleSection ocid={ocid} />
        </>
      );
    case "union":
      return (
        <>
          <UnionSummarySection ocid={ocid} />
          <UnionRaiderSection ocid={ocid} />
          <UnionArtifactSection ocid={ocid} />
          <UnionChampionSection ocid={ocid} />
        </>
      );
  }
}

function refreshKinds(page: DetailPage, grade: string): Array<[string, string?]> {
  return PAGE_SECTIONS[page].flatMap((k): Array<[string, string?]> => [
    k === "skill" ? [k, grade] : [k],
    ...(COMPANIONS[k] ?? []).map((c): [string] => [c]),
  ]);
}

export function SectionPage({ ocid, name, page }: { ocid: string; name: string; page: DetailPage }) {
  const { pop } = useNav();
  const summary = useCharacterSummary(ocid);
  const refreshSummary = useRefreshSummary();
  const refreshExtras = useRefreshExtras(ocid);
  const refreshRankings = useRefreshRankings();
  const refreshBattle = useRefreshBattle();
  const [grade] = useSkillGrade();
  const needsSummary = page === "stats" || page === "records";
  const records = page === "records";
  const title = DETAIL_PAGES.find((p) => p.id === page)?.title ?? page;
  const { refreshing, refresh } = useRefreshing(() => {
    const kinds = refreshKinds(page, grade);
    return runAction(
      () =>
        Promise.all([
          refreshSummary(ocid),
          refreshExtras(kinds),
          records ? refreshRankings(ocid) : null,
          records ? refreshBattle(ocid) : null,
        ]),
      "새로 고치지 못했어요",
    );
  });
  return (
    <>
      <ScreenHeader
        title={title}
        parent={name}
        onBack={pop}
        onSettings={() => openSettingsAction()}
        trailing={<RefreshButton onClick={refresh} loading={refreshing} />}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {needsSummary && summary.error && !summary.data ? (
            <StackItem key="error">
              <Module>
                <ErrorRow message={describeError(summary.error)} onRetry={() => summary.refetch()} />
              </Module>
            </StackItem>
          ) : null}
          {needsSummary && summary.isPending && !summary.error ? (
            <StackItem key="loading">
              <Module>
                <LoadingRow />
              </Module>
            </StackItem>
          ) : null}
          <StackItem key="sections" className="flex flex-col gap-2.5">
            <PageSections page={page} ocid={ocid} summary={summary.data} summaryPending={summary.isPending} />
          </StackItem>
        </AnimatePresence>
      </div>
    </>
  );
}
