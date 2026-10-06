import type { GuildBasic } from "@erda/api/generated/model";
import { GameIcon } from "@erda/ui/components/game-icon";
import { Module } from "@erda/ui/components/module";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";

export function GuildSkillsModule({ guild: g }: { guild: GuildBasic }) {
  const skills = [...(g.guild_skill ?? []), ...(g.guild_noblesse_skill ?? [])].filter((s) => (s.skill_level ?? 0) > 0);
  if (skills.length === 0) return null;
  return (
    <Module title="길드 스킬">
      {skills.map((s) => (
        <Item key={s.skill_name} size="row">
          <ItemMedia>
            <GameIcon src={s.skill_icon} size={22} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{s.skill_name}</ItemTitle>
            {s.skill_effect ? <ItemDescription title={s.skill_effect}>{s.skill_effect}</ItemDescription> : null}
          </ItemContent>
          <ItemValue>{`Lv.${s.skill_level}`}</ItemValue>
        </Item>
      ))}
    </Module>
  );
}
