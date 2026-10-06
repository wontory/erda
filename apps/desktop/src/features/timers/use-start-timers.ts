import { shortNameOf, type TimerGroup, type TimerPreset } from "@erda/core";

import { entryFromGroupEntry, entryFromPresetStart, timerCommands } from "./commands.ts";
import { useRecentPresets } from "./use-recent-presets.ts";

export function useStartTimers() {
  const recent = useRecentPresets();
  return {
    startPreset: async (preset: TimerPreset, buffRepeat: boolean) => {
      await timerCommands.start(entryFromPresetStart(preset, preset.repeatsByDefault || buffRepeat));
      await recent.push(preset.id).catch((e) => console.error("failed to save recent preset", e));
    },
    startGroup: (group: TimerGroup) => timerCommands.startGroup(group.entries.map(entryFromGroupEntry)),
    startCustom: (name: string, seconds: number, repeats: boolean) => {
      const label = name.trim() || "사용자 타이머";
      return timerCommands.start({
        name: label,
        shortName: shortNameOf(label),
        icon: "Timer",
        color: "orange",
        seconds: Math.max(1, Math.round(seconds)),
        repeats,
      });
    },
  };
}
