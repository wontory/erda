import { presetById, type TimerGroupEntry, type TimerPreset } from "@erda/core";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

import {
  activeTimerSchema,
  timersSnapshotSchema,
  type ActiveTimer,
  type StartEntry,
  type TimersSnapshot,
} from "./types.ts";

const checked = async <T>(schema: z.ZodType<T>, p: Promise<unknown>): Promise<T> => schema.parse(await p);

export const timerCommands = {
  start: (entry: StartEntry): Promise<ActiveTimer> => checked(activeTimerSchema, invoke("timers_start", { entry })),
  startGroup: (entries: StartEntry[]): Promise<ActiveTimer[]> =>
    checked(z.array(activeTimerSchema), invoke("timers_start_group", { entries })),
  cancel: (id: string) => invoke<void>("timers_cancel", { id }),
  cancelAll: () => invoke<void>("timers_cancel_all"),
  setRepeat: (id: string, repeats: boolean) => invoke<void>("timers_set_repeat", { id, repeats }),
  restart: (id: string): Promise<ActiveTimer | null> =>
    checked(activeTimerSchema.nullable(), invoke("timers_restart", { id })),
  dismissCompleted: (id: string) => invoke<void>("timers_dismiss_completed", { id }),
  dismissAllCompleted: () => invoke<void>("timers_dismiss_all_completed"),
  snapshot: (): Promise<TimersSnapshot> => checked(timersSnapshotSchema, invoke("timers_snapshot")),
};

type TimerColor = "green" | "orange";

export const presetColor = (category: TimerPreset["category"] | undefined): TimerColor =>
  category === "buff" ? "green" : "orange";

export const entryFromPresetStart = (preset: TimerPreset, repeats: boolean): StartEntry => ({
  name: preset.name,
  shortName: preset.shortName,
  icon: preset.icon,
  color: presetColor(preset.category),
  seconds: preset.seconds,
  repeats,
});

export const entryFromGroupEntry = (e: TimerGroupEntry): StartEntry => {
  const preset = e.presetId ? presetById(e.presetId) : undefined;
  return {
    name: e.name,
    shortName: e.shortName,
    icon: preset?.icon ?? "Timer",
    color: presetColor(preset?.category),
    seconds: e.seconds,
    repeats: e.repeats,
  };
};
