import { z } from "zod";

export const activeTimerSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  icon: z.string(),
  color: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  seconds: z.number().int(),
  repeats: z.boolean(),
});
export const completedTimerSchema = z.object({ timer: activeTimerSchema, finishedMs: z.number() });
export const timersSnapshotSchema = z.object({
  nowMs: z.number(),
  active: z.array(activeTimerSchema),
  completed: z.array(completedTimerSchema),
});

export type ActiveTimer = z.infer<typeof activeTimerSchema>;
export type CompletedTimer = z.infer<typeof completedTimerSchema>;
export type TimersSnapshot = z.infer<typeof timersSnapshotSchema>;

export interface StartEntry {
  name: string;
  shortName: string;
  icon: string;
  color: string;
  seconds: number;
  repeats: boolean;
}

export const EMPTY_SNAPSHOT: TimersSnapshot = { nowMs: 0, active: [], completed: [] };

export const newerSnapshot = (current: TimersSnapshot | null, next: TimersSnapshot) =>
  current === null || next.nowMs >= current.nowMs;

export const startModeSchema = z.enum(["프리셋", "그룹", "직접"]);
export type StartMode = z.infer<typeof startModeSchema>;
