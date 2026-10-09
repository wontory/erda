import { describeError } from "@erda/api/errors";
import type { CharacterSummary } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { Sprite } from "@erda/ui/components/sprite";
import { Swap } from "@erda/ui/components/swap";
import { Button } from "@erda/ui/components/ui/button";
import { Progress } from "@erda/ui/components/ui/progress";
import { WorldIcon } from "@erda/ui/components/world-icon";
import { Heart, User } from "lucide-react";

import { KeyMetrics } from "#/app/pages/character/parts/key-metrics.tsx";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { useCharacterLook } from "#/features/character/use-character-look.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

function CharacterHeadline({ summary: s }: { summary: CharacterSummary }) {
  const look = useCharacterLook(s.image);
  return (
    <div className="flex items-center gap-3">
      <Sprite {...look} size={96} alt="" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{s.name}</div>
        <div className="text-[12px] text-muted-foreground">
          <span className="font-medium tabular-nums">Lv.{s.level}</span> · {s.job}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <WorldIcon world={s.world} size={11} alt="" />
          {s.world}
          {s.guild ? ` · ${s.guild}` : ""}
          {s.popularity !== null ? (
            <span className="inline-flex items-center gap-0.5">
              <Heart size={10} className="fill-pink-500 text-pink-500" />
              {s.popularity.toLocaleString("en-US")}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Progress aria-label="경험치" value={Number(s.expRate) || 0} max={100} className="flex-1" />
          <span className="text-[11px] text-muted-foreground tabular-nums">{s.expRate}%</span>
        </div>
      </div>
    </div>
  );
}

export function CharacterModule({ onOpen }: { onOpen: () => void }) {
  const main = useMainCharacter();
  if (!main.nameLoaded) return null;
  const s = main.summary;
  const view = s ? "summary" : main.isPending ? "loading" : main.error ? "error" : "empty";
  return (
    <Module title="캐릭터" icon={User} onOpen={s ? onOpen : undefined}>
      <AutoHeight>
        <Swap id={view}>
          {s ? (
            <>
              <CharacterHeadline summary={s} />
              <KeyMetrics summary={s} className="mt-3" />
            </>
          ) : main.isPending ? (
            <LoadingRow label="본캐 불러오는 중…" />
          ) : main.error ? (
            <ErrorRow
              message={describeError(main.error)}
              onRetry={() => void runAction(() => main.refresh(), "본캐를 다시 불러오지 못했어요")}
            />
          ) : (
            <EmptyState
              icon={User}
              title="본캐가 없어요"
              description="설정 › 캐릭터에서 닉네임을 정해 주세요"
              action={
                <Button variant="outline" onClick={() => void openSettingsAction()}>
                  설정 열기
                </Button>
              }
            />
          )}
        </Swap>
      </AutoHeight>
    </Module>
  );
}
