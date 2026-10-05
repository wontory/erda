import { z } from "zod";

import type { TimerPreset } from "./presets.ts";

export const timerGroupEntrySchema = z.object({
  id: z.string().min(1),
  presetId: z.string().optional(),
  name: z.string(),
  shortName: z.string(),
  seconds: z.number().int().positive(),
  repeats: z.boolean(),
});
export const timerGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  entries: z.array(timerGroupEntrySchema),
});
export const timerGroupsSchema = z.array(timerGroupSchema);

export type TimerGroupEntry = z.infer<typeof timerGroupEntrySchema>;
export type TimerGroup = z.infer<typeof timerGroupSchema>;

const CUSTOM_ENTRY_NAME = "새 타이머";
const CUSTOM_ENTRY_SECONDS = 600;

export const shortNameOf = (name: string) => [...name].slice(0, 3).join("");

export const entryFromPreset = (preset: TimerPreset, makeId: () => string): TimerGroupEntry => ({
  id: makeId(),
  presetId: preset.id,
  name: preset.name,
  shortName: preset.shortName,
  seconds: preset.seconds,
  repeats: preset.repeatsByDefault,
});

export const customEntry = (makeId: () => string): TimerGroupEntry => ({
  id: makeId(),
  name: CUSTOM_ENTRY_NAME,
  shortName: shortNameOf(CUSTOM_ENTRY_NAME),
  seconds: CUSTOM_ENTRY_SECONDS,
  repeats: false,
});

const durationLabel = (seconds: number) => (seconds % 60 === 0 ? `${seconds / 60}분` : `${seconds}초`);

const describeEntry = (entry: TimerGroupEntry) =>
  `${entry.shortName} ${durationLabel(entry.seconds)}${entry.repeats ? " ↻" : ""}`;

export const describeGroup = (group: TimerGroup) => group.entries.map(describeEntry).join(" · ");
