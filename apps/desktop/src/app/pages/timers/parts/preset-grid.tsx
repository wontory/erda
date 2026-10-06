import { PRESET_CATEGORY_META, TIMER_PRESETS, presetDuration, type PresetCategory, type TimerPreset } from "@erda/core";
import { SectionHeader } from "@erda/ui/components/section-header";
import { TimerIcon } from "@erda/ui/components/timer-icon";
import { Switch } from "@erda/ui/components/ui/switch";
import { Hammer, Sparkles } from "lucide-react";
import { useId } from "react";

import { presetColor } from "#/features/timers/commands.ts";

const CATEGORY_ICON = { install: Hammer, buff: Sparkles } as const;
const CATEGORIES: PresetCategory[] = ["install", "buff"];

function PresetButton({ preset, onStart }: { preset: TimerPreset; onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-100 ease-out hover:bg-glass-card-hover focus-visible:outline-2 active:bg-foreground/10"
    >
      <TimerIcon name={preset.icon} color={presetColor(preset.category)} size={16} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px]">{preset.name}</span>
        <span className="block text-[11px] text-muted-foreground">
          {presetDuration(preset.seconds)}
          {preset.repeatsByDefault ? " · 반복" : ""}
        </span>
      </span>
    </button>
  );
}

export function PresetGrid({
  buffRepeat,
  onBuffRepeat,
  onStart,
}: {
  buffRepeat: boolean;
  onBuffRepeat: (on: boolean) => void;
  onStart: (preset: TimerPreset) => void;
}) {
  const buffRepeatId = useId();
  return (
    <div className="flex flex-col gap-2">
      {CATEGORIES.map((c) => (
        <div key={c}>
          <SectionHeader
            title={PRESET_CATEGORY_META[c].title}
            color={PRESET_CATEGORY_META[c].color}
            icon={CATEGORY_ICON[c]}
          />
          <div className="grid grid-cols-2 gap-1">
            {TIMER_PRESETS.filter((p) => p.category === c).map((p) => (
              <PresetButton key={p.id} preset={p} onStart={() => onStart(p)} />
            ))}
          </div>
        </div>
      ))}
      <label htmlFor={buffRepeatId} className="flex items-center justify-between gap-2 px-1 text-[12px]">
        <span>사냥 버프도 끝나면 자동으로 다시 시작</span>
        <Switch id={buffRepeatId} size="sm" checked={buffRepeat} onCheckedChange={(on) => onBuffRepeat(on)} />
      </label>
    </div>
  );
}
