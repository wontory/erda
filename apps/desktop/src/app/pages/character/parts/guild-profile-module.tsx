import type { GuildBasic } from "@erda/api/generated/model";
import { KoreanNumber } from "@erda/core";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";
import { WorldIcon } from "@erda/ui/components/world-icon";

import { GuildMark } from "./guild-mark.tsx";

export function GuildProfileModule({ guild: g, world, name }: { guild: GuildBasic; world: string; name: string }) {
  const fame = g.guild_fame ?? 0;
  const point = g.guild_point ?? 0;
  return (
    <Module>
      <div className="flex items-center gap-3">
        <GuildMark world={world} name={name} size={40} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">{g.guild_name}</div>
          <div className="text-[12px] text-muted-foreground">
            <span className="text-primary">Lv.{g.guild_level}</span>
            {" · "}
            <span className="inline-flex items-center gap-1">
              <WorldIcon world={world} size={11} alt="" />
              {world}
            </span>
            {" · 마스터 "}
            {g.guild_master_name}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Metric title="길드원" value={`${g.guild_member_count ?? g.guild_member?.length ?? 0}`} tint="text-primary" />
        <Metric title="명성치" value={KoreanNumber.compact(fame)} help={KoreanNumber.grouped(fame)} />
        <Metric title="길드 포인트" value={KoreanNumber.compact(point)} help={KoreanNumber.grouped(point)} />
      </div>
    </Module>
  );
}
