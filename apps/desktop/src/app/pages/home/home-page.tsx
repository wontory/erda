import { hasApiKey } from "@erda/core";
import { ScreenHeader } from "@erda/ui/components/screen-header";
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
        clearClassName="animate-in fade-in zoom-in-95 duration-100 ease-out motion-reduce:zoom-in-100"
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
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {hasApiKey(apiKey) ? (
          <>
            <HomeSearch />
            <FavoritesModule limit={6} onOpen={(ocid, name) => push(pages.viewing(ocid, name))} />
            <CharacterModule onOpen={() => push(pages.character())} />
          </>
        ) : (
          <OnboardingModule />
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <TimerModule onOpen={() => push(pages.timers())} />
          <SchedulerModule onOpen={() => push(pages.scheduler())} />
        </div>
        <NewsModule onOpen={() => push(pages.news())} onOpenEntry={(id) => push(pages.article(id))} />
        <AccountModule onOpen={() => push(pages.account())} />
        <CalculatorsModule onOpen={(id) => push(pages.calculator(id))} />
        <SimulatorsModule onOpen={(id) => push(pages.simulator(id))} />
      </div>
    </>
  );
}
