import { endClock, formatRemaining, presetDuration, type TimerPreset } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { Module } from "@erda/ui/components/module";
import { RingGauge } from "@erda/ui/components/ring-gauge";
import { Swap } from "@erda/ui/components/swap";
import { TimerIcon } from "@erda/ui/components/timer-icon";
import { Badge } from "@erda/ui/components/ui/badge";
import { timerTint } from "@erda/ui/lib/timer-tint";
import { Timer } from "lucide-react";

import { TrailingText } from "#/app/pages/shared/trailing-text.tsx";
import { presetColor } from "#/features/timers/commands.ts";
import type { ActiveTimer } from "#/features/timers/types.ts";
import { useRecentPresets } from "#/features/timers/use-recent-presets.ts";
import { useStartTimers } from "#/features/timers/use-start-timers.ts";
import { useTimers } from "#/features/timers/use-timers.ts";
import { useAction } from "#/lib/action.ts";

function NearestTimer({ timer, remaining }: { timer: ActiveTimer; remaining: number }) {
  return (
    <div className="flex items-center gap-2">
      <RingGauge value={remaining} max={timer.seconds} size={24} tint={timerTint(timer.color)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px]">{timer.name}</div>
        <div className="text-[11px] text-muted-foreground">종료 {endClock(timer.endMs)}</div>
      </div>
      <div className="text-[15px] font-semibold tabular-nums">{formatRemaining(remaining)}</div>
    </div>
  );
}

function PresetChip({ preset, onStart }: { preset: TimerPreset; onStart: () => void }) {
  return (
    <Badge
      variant="outline"
      render={(props) => <button type="button" {...props} />}
      onClick={onStart}
      className="h-6 hover:bg-muted"
    >
      <TimerIcon name={preset.icon} color={presetColor(preset.category)} size={12} />
      {preset.shortName} {presetDuration(preset.seconds)}
    </Badge>
  );
}

export function TimerModule({ onOpen }: { onOpen: () => void }) {
  const timers = useTimers();
  const { presets } = useRecentPresets();
  const start = useStartTimers();
  const { run } = useAction();
  const n = timers.active.length;
  const nearest = timers.nearest;
  return (
    <Module
      title="타이머"
      icon={Timer}
      onOpen={onOpen}
      trailing={<TrailingText tone={n > 0 ? "text-primary" : undefined}>실행 중 {n}</TrailingText>}
    >
      <AutoHeight>
        <Swap id={nearest ? "nearest" : "hint"}>
          {nearest ? (
            <NearestTimer timer={nearest} remaining={timers.remainingOf(nearest)} />
          ) : (
            <div className="text-[11px] text-muted-foreground">시작하면 종료 직전에 화면 위에 카운트다운이 떠요.</div>
          )}
        </Swap>
      </AutoHeight>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <PresetChip
            key={p.id}
            preset={p}
            onStart={() => void run(() => start.startPreset(p, false), "타이머를 시작하지 못했어요")}
          />
        ))}
      </div>
    </Module>
  );
}
