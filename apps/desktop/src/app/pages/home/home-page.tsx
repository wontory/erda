import { hasApiKey } from "@erda/core";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { StackItem } from "@erda/ui/components/stack-item";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { pages } from "#/app/nav/stack.ts";
import { FavoritesModule } from "#/app/pages/character/parts/favorites-module.tsx";
import { SearchField } from "#/app/pages/shared/search-field.tsx";
import { resultsPageFor } from "#/app/pages/shared/search.ts";
import { useSetting } from "#/features/settings/use-settings.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

import { AccountModule } from "./account-module.tsx";
import { CalculatorsModule } from "./calculators-module.tsx";
import { CharacterModule } from "./character-module.tsx";
import { NewsModule } from "./news-module.tsx";
import { OnboardingModule } from "./onboarding-module.tsx";
import { SchedulerModule } from "./scheduler-module.tsx";
import { SimulatorsModule } from "./simulators-module.tsx";
import { TimerModule } from "./timer-module.tsx";
import { UpdateBanner } from "./update-banner.tsx";

function HomeSearch() {
  const { push } = useNav();
  const [query, setQuery] = useState("");
  const submit = () => {
    const page = resultsPageFor(query);
    if (!page) return;
    push(page);
    setQuery("");
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <SearchField
        value={query}
        onValueChange={setQuery}
        label="캐릭터·길드 이름 검색"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </form>
  );
}

export function HomePage() {
  const [apiKey, , loaded] = useSetting("settings.apiKey");
  const { push } = useNav();
  const header = <ScreenHeader title="Erda" onSettings={() => void openSettingsAction()} />;
  if (!loaded) return header;
  return (
    <>
      {header}
      <UpdateBanner />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {hasApiKey(apiKey)
            ? [
                <StackItem key="search">
                  <HomeSearch />
                </StackItem>,
                <StackItem key="favorites">
                  <FavoritesModule limit={6} onOpen={(ocid, name) => push(pages.viewing(ocid, name))} />
                </StackItem>,
                <StackItem key="character">
                  <CharacterModule onOpen={() => push(pages.character())} />
                </StackItem>,
              ]
            : [
                <StackItem key="onboarding">
                  <OnboardingModule />
                </StackItem>,
              ]}
          <StackItem key="timers" className="grid grid-cols-2 gap-2.5">
            <TimerModule onOpen={() => push(pages.timers())} />
            <SchedulerModule onOpen={() => push(pages.scheduler())} />
          </StackItem>
          <StackItem key="news">
            <NewsModule onOpen={() => push(pages.news())} onOpenEntry={(id) => push(pages.article(id))} />
          </StackItem>
          <StackItem key="account">
            <AccountModule onOpen={() => push(pages.account())} />
          </StackItem>
          <StackItem key="calculators">
            <CalculatorsModule onOpen={(id) => push(pages.calculator(id))} />
          </StackItem>
          <StackItem key="simulators">
            <SimulatorsModule onOpen={(id) => push(pages.simulator(id))} />
          </StackItem>
        </AnimatePresence>
      </div>
    </>
  );
}
