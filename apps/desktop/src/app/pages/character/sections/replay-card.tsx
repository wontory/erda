import { describeError } from "@erda/api/errors";
import { KoreanNumber, TimeFormat, replaySummary, topSkills, type Replay } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";
import { Swap } from "@erda/ui/components/swap";

type ReplayResult = { data?: unknown; isLoading: boolean; error: unknown };
type SkillShare = ReturnType<typeof topSkills>[number];

function SkillShareRow({ skill }: { skill: SkillShare }) {
  const ratio = Math.max(0, Math.min(100, skill.percent)) / 100;
  return (
    <div className="text-[11px]">
      <div className="flex justify-between">
        <span className="truncate">{skill.name}</span>
        <span className="text-muted-foreground tabular-nums">
          {skill.percent}% · {skill.uses}회
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full origin-left rounded-full bg-red-500 transition-transform duration-240 ease-snappy motion-reduce:transition-none"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}

function ReplayBody({ data }: { data: unknown }) {
  const s = replaySummary(data);
  const skills = topSkills(data);
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Metric title="총 데미지" value={KoreanNumber.format(s.totalDamage)} />
        <Metric title="DPS" value={KoreanNumber.format(s.dps)} />
        <Metric title="시간" value={TimeFormat.clock(s.playTime)} />
        <Metric title="종료" value={s.endType || "-"} />
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {skills.map((k, i) => (
          <SkillShareRow key={`${k.name}:${i}`} skill={k} />
        ))}
      </div>
    </>
  );
}

export function ReplayCard({ replay, result }: { replay: Replay; result: ReplayResult }) {
  const title = `${TimeFormat.shortDate(replay.date)} · 회차 ${replay.period}`;
  const view = result.isLoading ? "loading" : result.error ? "error" : "data";
  return (
    <Module title={title}>
      <AutoHeight>
        <Swap id={view}>
          {view === "loading" ? <LoadingRow /> : null}
          {view === "error" ? <div className="text-[12px] text-destructive">{describeError(result.error)}</div> : null}
          {view === "data" ? <ReplayBody data={result.data} /> : null}
        </Swap>
      </AutoHeight>
    </Module>
  );
}
