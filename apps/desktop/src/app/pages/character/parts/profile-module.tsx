import { TimeFormat, type CharacterSummary } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Sprite } from "@erda/ui/components/sprite";
import { Progress } from "@erda/ui/components/ui/progress";
import { WorldIcon } from "@erda/ui/components/world-icon";
import { Heart } from "lucide-react";

import { GuildMark } from "./guild-mark.tsx";

type OpenGuild = (world: string, guild: string) => void;

function GuildLink({ world, guild, onOpenGuild }: { world: string; guild: string; onOpenGuild?: OpenGuild }) {
  return (
    <>
      <span>·</span>
      <GuildMark world={world} name={guild} size={14} />
      {onOpenGuild ? (
        <button type="button" className="text-primary hover:underline" onClick={() => onOpenGuild(world, guild)}>
          {guild}
        </button>
      ) : (
        <span>{guild}</span>
      )}
    </>
  );
}

export function ProfileModule({ summary, onOpenGuild }: { summary: CharacterSummary; onOpenGuild?: OpenGuild }) {
  const rate = Number(summary.expRate) || 0;
  return (
    <Module>
      <div className="flex items-center gap-3">
        <Sprite src={summary.image} size={96} zoom={1.3} alt="" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-bold">{summary.name}</div>
          <div className="text-[13px]">
            <span className="text-primary">Lv.{summary.level}</span> · {summary.job}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <WorldIcon world={summary.world} size={12} alt="" />
              {summary.world}
            </span>
            {summary.guild ? <GuildLink world={summary.world} guild={summary.guild} onOpenGuild={onOpenGuild} /> : null}
            {summary.popularity !== null ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Heart size={11} className="fill-pink-500 text-pink-500" />
                  {summary.popularity.toLocaleString("en-US")}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="shrink-0">경험치</span>
        <Progress value={rate} max={100} className="flex-1" aria-label="경험치" />
        <span className="shrink-0 tabular-nums">
          {summary.expRate}% · Lv.{summary.level + 1}까지
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {TimeFormat.relative(new Date(summary.fetchedAt))} 갱신 · 넥슨 데이터는 평균 15분 뒤에 반영돼요.
      </p>
    </Module>
  );
}
