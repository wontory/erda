import { Module } from "@erda/ui/components/module";
import { MotionProvider } from "@erda/ui/components/motion-provider";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { Toaster } from "@erda/ui/components/ui/toast";
import { DURATION, EASE_SNAPPY } from "@erda/ui/lib/motion";
import { focusScreenTitle } from "@erda/ui/lib/screen-title";
import { cn } from "@erda/ui/lib/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { AnimatePresence, m, type Variants } from "motion/react";
import { useRef, type RefObject } from "react";

import { useNav } from "#/app/nav/context.ts";
import { NavProvider } from "#/app/nav/nav-provider.tsx";
import { clearLastPage } from "#/app/nav/persist.ts";
import { HOME, type Page } from "#/app/nav/stack.ts";
import { useScreenMemory } from "#/app/nav/use-screen-memory.ts";
import { CalculatorPage } from "#/app/pages/calculators/calculator-page.tsx";
import { CharacterPage } from "#/app/pages/character/character-page.tsx";
import { GuildPage } from "#/app/pages/character/guild-page.tsx";
import { ResultsPage } from "#/app/pages/character/results-page.tsx";
import { SectionPage } from "#/app/pages/character/section-page.tsx";
import { ViewingPage } from "#/app/pages/character/viewing-page.tsx";
import { HomePage } from "#/app/pages/home/home-page.tsx";
import { AccountPage } from "#/app/pages/insights/account-page.tsx";
import { AchievementsPage } from "#/app/pages/insights/achievements-page.tsx";
import { HistoryPage } from "#/app/pages/insights/history-page.tsx";
import { ArticlePage } from "#/app/pages/news/article-page.tsx";
import { NewsPage } from "#/app/pages/news/news-page.tsx";
import { SchedulerPage } from "#/app/pages/scheduler/scheduler-page.tsx";
import { SimulatorPage } from "#/app/pages/simulators/simulator-page.tsx";
import { TimersPage } from "#/app/pages/timers/timers-page.tsx";
import { MainCharacterProvider } from "#/features/character/main-character-provider.tsx";
import { useHistorySettings } from "#/features/insights/use-history-settings.ts";
import { useResetQueriesOnKeyChange } from "#/features/settings/use-reset-queries-on-key-change.ts";
import { ErrorBoundary } from "#/lib/error-boundary.tsx";
import { queryClient } from "#/lib/query.ts";
import { usePanelVisibility } from "#/lib/tauri.ts";

function Screen({ page }: { page: Page }) {
  switch (page.kind) {
    case "home":
      return <HomePage />;
    case "character":
      return <CharacterPage />;
    case "timers":
      return <TimersPage />;
    case "scheduler":
      return <SchedulerPage />;
    case "news":
      return <NewsPage />;
    case "article":
      return <ArticlePage key={page.entryId} entryId={page.entryId} />;
    case "calculator":
      return <CalculatorPage calculator={page.calculator} />;
    case "simulator":
      return <SimulatorPage simulator={page.simulator} />;
    case "account":
      return <AccountPage />;
    case "history":
      return <HistoryPage key={page.history} kind={page.history} />;
    case "achievements":
      return <AchievementsPage />;
    case "results":
      return <ResultsPage query={page.query} />;
    case "viewing":
      return <ViewingPage ocid={page.ocid} name={page.name} />;
    case "section":
      return <SectionPage ocid={page.ocid} name={page.name} page={page.page} />;
    case "guild":
      return <GuildPage world={page.world} name={page.name} />;
  }
}

function ScreenFallback({ reset }: { reset: () => void }) {
  const { canGoBack, pop, restore } = useNav();
  const goHome = () => {
    restore(HOME);
    requestAnimationFrame(() => focusScreenTitle());
  };
  return (
    <>
      <ScreenHeader title="오류" onBack={canGoBack ? () => pop() : undefined} />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <Module>
          <div role="alert" className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertCircle aria-hidden className="size-8 text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="m-0 text-[14px] font-semibold">화면을 표시하지 못했어요</p>
              <p className="m-0 text-[12px] text-muted-foreground">다시 시도하거나 홈으로 돌아가 주세요.</p>
            </div>
            <div className="flex w-full gap-2 *:flex-1">
              <Button variant="outline" onClick={goHome}>
                홈으로
              </Button>
              <Button onClick={reset}>다시 시도</Button>
            </div>
          </div>
        </Module>
      </div>
    </>
  );
}

type Motion = { dir: "forward" | "back"; instant: boolean };

const pageVariants: Variants = {
  enter: ({ dir, instant }: Motion) =>
    instant ? { opacity: 1, x: 0 } : { opacity: 0, x: dir === "forward" ? 12 : -12 },
  center: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE_SNAPPY } },
  exit: ({ dir, instant }: Motion) =>
    instant
      ? { opacity: 0, transition: { duration: 0 } }
      : { opacity: 0, x: dir === "forward" ? -8 : 8, transition: { duration: DURATION.fast, ease: "easeIn" } },
};

const clearLastPageSoon = () => setTimeout(() => void clearLastPage(), 250);

function Screens({ viewportRef }: { viewportRef: RefObject<HTMLDivElement | null> }) {
  useResetQueriesOnKeyChange();
  useHistorySettings();
  const { current, direction, via } = useNav();
  const mainRef = useRef<HTMLElement>(null);
  useScreenMemory(mainRef, viewportRef);
  const motion: Motion = { dir: direction, instant: via !== "pointer" };

  return (
    <main ref={mainRef} className="relative overflow-x-clip">
      <AnimatePresence initial={false} mode="popLayout" custom={motion}>
        <m.div
          key={current.id}
          data-page={current.id}
          custom={motion}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full"
        >
          <ErrorBoundary onError={clearLastPageSoon} fallback={(_e, reset) => <ScreenFallback reset={reset} />}>
            <Screen page={current} />
          </ErrorBoundary>
        </m.div>
      </AnimatePresence>
    </main>
  );
}

const PANEL_CLASS =
  "flex h-screen w-screen origin-top flex-col overflow-hidden rounded-[var(--panel-radius)] bg-panel-scrim transition-[opacity,translate,scale] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-opacity";
const PANEL_SHOWN = "translate-y-0 scale-100 opacity-100 duration-160 ease-snappy";
const PANEL_HIDDEN = "-translate-y-1 scale-[0.98] opacity-0 duration-120 ease-in";

export function App() {
  const visible = usePanelVisibility();
  const viewportRef = useRef<HTMLDivElement>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <MainCharacterProvider>
          <NavProvider>
            <div className={cn(PANEL_CLASS, visible ? PANEL_SHOWN : PANEL_HIDDEN)}>
              <m.div ref={viewportRef} layoutScroll className="scrollbar-none h-full overflow-y-auto">
                <Screens viewportRef={viewportRef} />
              </m.div>
            </div>
            <Toaster />
          </NavProvider>
        </MainCharacterProvider>
      </MotionProvider>
    </QueryClientProvider>
  );
}
