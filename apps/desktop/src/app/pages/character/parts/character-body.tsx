import type { CharacterSummary } from "@erda/core";

import { useNav } from "#/app/nav/context.ts";
import { pages } from "#/app/nav/stack.ts";
import { detailRowValues, useDetailBundle } from "#/features/character/use-detail-bundle.ts";

import { DetailRowsModule } from "./detail-rows-module.tsx";
import { KeyStatsModule } from "./key-stats-module.tsx";
import { ProfileModule } from "./profile-module.tsx";

export function CharacterBody({ summary }: { summary: CharacterSummary }) {
  const { push } = useNav();
  const bundle = useDetailBundle(summary.ocid);
  return (
    <>
      <ProfileModule summary={summary} onOpenGuild={(world, guild) => push(pages.guild(world, guild))} />
      <KeyStatsModule summary={summary} />
      <DetailRowsModule
        ocid={summary.ocid}
        values={detailRowValues(summary, bundle)}
        onOpen={(page) => push(pages.section(summary.ocid, summary.name, page))}
      />
    </>
  );
}
