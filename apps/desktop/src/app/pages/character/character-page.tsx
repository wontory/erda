import { describeError } from "@erda/api/errors";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { StackItem } from "@erda/ui/components/stack-item";
import { Button } from "@erda/ui/components/ui/button";
import { User } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { useNav } from "#/app/nav/context.ts";
import { CharacterBody } from "#/app/pages/character/parts/character-body.tsx";
import { PROFILE_LOADING_HEIGHT } from "#/app/pages/character/parts/profile-module.tsx";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useRefreshing } from "#/app/pages/shared/use-refreshing.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

export function CharacterPage() {
  const { pop } = useNav();
  const main = useMainCharacter();
  const { refreshing, refresh } = useRefreshing(() => runAction(() => main.refresh(), "새로 고치지 못했어요"));
  const s = main.summary;
  const loadingMain = (
    <Module>
      <LoadingRow label="본캐 불러오는 중…" minHeight={PROFILE_LOADING_HEIGHT} />
    </Module>
  );
  const missing = main.nameLoaded && !s;
  return (
    <>
      <ScreenHeader
        title={s?.name ?? "캐릭터"}
        subtitle={s ? `${s.world} · ${s.job}` : undefined}
        onBack={pop}
        onSettings={() => openSettingsAction()}
        trailing={<RefreshButton onClick={refresh} loading={refreshing} disabled={!main.name} />}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {!main.nameLoaded ? <StackItem key="loading">{loadingMain}</StackItem> : null}
          {missing && main.error ? (
            <StackItem key="error">
              <Module>
                <ErrorRow message={describeError(main.error)} onRetry={refresh} />
              </Module>
            </StackItem>
          ) : null}
          {missing && main.isPending ? <StackItem key="loading">{loadingMain}</StackItem> : null}
          {missing && !main.isPending && !main.error ? (
            <StackItem key="empty">
              <Module>
                <EmptyState
                  icon={User}
                  title="본캐가 없어요"
                  action={
                    <Button variant="outline" onClick={() => openSettingsAction()}>
                      설정 열기
                    </Button>
                  }
                />
              </Module>
            </StackItem>
          ) : null}
          {s ? (
            <StackItem key="body" className="flex flex-col gap-2.5">
              <CharacterBody summary={s} />
            </StackItem>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
