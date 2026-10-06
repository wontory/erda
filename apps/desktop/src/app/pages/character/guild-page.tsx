import { describeError } from "@erda/api/errors";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";

import { useNav } from "#/app/nav/context.ts";
import { GuildMembersModule } from "#/app/pages/character/parts/guild-members-module.tsx";
import { GuildProfileModule } from "#/app/pages/character/parts/guild-profile-module.tsx";
import { GuildSkillsModule } from "#/app/pages/character/parts/guild-skills-module.tsx";
import { RankingCardView } from "#/app/pages/character/sections/ranking-card-view.tsx";
import { useRefreshing } from "#/app/pages/shared/use-refreshing.ts";
import { useGuildRanking } from "#/features/character/use-guild-ranking.ts";
import { useGuild } from "#/features/character/use-guild.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

export function GuildPage({ world, name }: { world: string; name: string }) {
  const { pop } = useNav();
  const guild = useGuild(world, name);
  const ranking = useGuildRanking(world, name, guild.isSuccess);
  const { refreshing, refresh } = useRefreshing(() =>
    runAction(
      () => Promise.all([guild.refresh(), guild.isSuccess ? ranking.refresh() : null]),
      "길드를 새로 고치지 못했어요",
    ),
  );
  const g = guild.data;
  return (
    <>
      <ScreenHeader
        title={name}
        subtitle={world}
        onBack={pop}
        onSettings={() => openSettingsAction()}
        trailing={<RefreshButton onClick={refresh} loading={refreshing} />}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {guild.error ? (
          <Module>
            <ErrorRow message={describeError(guild.error)} onRetry={() => guild.refetch()} />
          </Module>
        ) : null}
        {guild.isPending ? (
          <Module>
            <LoadingRow />
          </Module>
        ) : null}
        {g ? (
          <>
            <GuildProfileModule guild={g} world={world} name={name} />
            <Module>
              <RankingCardView card={ranking.card} />
            </Module>
            <GuildSkillsModule guild={g} />
            <GuildMembersModule guild={g} />
          </>
        ) : null}
      </div>
    </>
  );
}
