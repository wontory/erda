import { describeError } from "@erda/api/errors";
import type { CharacterSummary } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { Star, UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { CharacterBody } from "#/app/pages/character/parts/character-body.tsx";
import { useRefreshing } from "#/app/pages/shared/use-refreshing.ts";
import { useCharacterSummary, useRefreshSummary } from "#/features/character/use-character-summary.ts";
import { useFavorites } from "#/features/character/use-favorites.ts";
import { useRecent } from "#/features/character/use-recent.ts";
import { useSetting } from "#/features/settings/use-settings.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

function useRecordRecent(summary: CharacterSummary | undefined) {
  const { record, loaded } = useRecent();
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (!summary || !loaded || recorded.current === summary.ocid) return;
    recorded.current = summary.ocid;
    record(summary).catch((e) => console.error("failed to record recent", e));
  }, [summary, loaded, record]);
}

function FavoriteButton({
  summary,
  favorite,
  popped,
  onToggle,
}: {
  summary: CharacterSummary;
  favorite: boolean;
  popped: boolean;
  onToggle: (summary: CharacterSummary) => void;
}) {
  const label = favorite ? "즐겨찾기 해제" : "즐겨찾기 추가";
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={() => onToggle(summary)}>
      <Star
        key={String(favorite)}
        className={`${favorite ? "fill-yellow-500 text-yellow-500" : ""} ${popped ? "animate-in duration-200 ease-snappy zoom-in-50 motion-reduce:animate-none" : ""}`}
      />
    </Button>
  );
}

export function ViewingPage({ ocid, name }: { ocid: string; name: string }) {
  const { pop } = useNav();
  const summary = useCharacterSummary(ocid);
  const refreshSummary = useRefreshSummary();
  const { isFavorite, toggle } = useFavorites();
  const [mainName, setMainName, mainLoaded] = useSetting("settings.mainCharacterName");
  const { refreshing, refresh } = useRefreshing(() => runAction(() => refreshSummary(ocid), "새로 고치지 못했어요"));
  const s = summary.data;
  useRecordRecent(s);
  const [popped, setPopped] = useState(false);
  const toggleFavorite = (target: CharacterSummary) => {
    setPopped(true);
    return runAction(() => toggle(target), "즐겨찾기를 바꾸지 못했어요");
  };
  const canSetMain = s && mainLoaded && mainName.trim() !== s.name;
  return (
    <>
      <ScreenHeader
        title={s?.name ?? name}
        subtitle={s ? `${s.world} · ${s.job}` : undefined}
        onBack={pop}
        onSettings={() => openSettingsAction()}
        trailing={
          <>
            {s ? (
              <FavoriteButton summary={s} favorite={isFavorite(ocid)} popped={popped} onToggle={toggleFavorite} />
            ) : null}
            {canSetMain ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="본캐로 지정"
                title="본캐로 지정"
                onClick={() => runAction(() => setMainName(s.name), "본캐를 바꾸지 못했어요")}
              >
                <UserCheck />
              </Button>
            ) : null}
            <RefreshButton onClick={refresh} loading={refreshing} />
          </>
        }
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {summary.error ? (
          <Module>
            <ErrorRow message={describeError(summary.error)} onRetry={() => summary.refetch()} />
          </Module>
        ) : null}
        {summary.isPending ? (
          <Module>
            <LoadingRow label={`${name} 불러오는 중…`} />
          </Module>
        ) : null}
        {s ? <CharacterBody summary={s} /> : null}
      </div>
    </>
  );
}
