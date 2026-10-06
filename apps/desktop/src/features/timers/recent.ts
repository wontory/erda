import { TIMER_PRESETS, presetById, type TimerPreset } from "@erda/core";

const RECENT_LIMIT = 2;
const QUICK_DEFAULTS = ["solJanus120", "rune"];

export const pushRecent = (list: string[], id: string): string[] =>
  [id, ...list.filter((x) => x !== id)].slice(0, RECENT_LIMIT);

export function quickStartPresets(ids: string[]): TimerPreset[] {
  const picked: TimerPreset[] = [];
  for (const id of [...ids, ...QUICK_DEFAULTS]) {
    const p = presetById(id);
    if (p && !picked.includes(p)) picked.push(p);
    if (picked.length === RECENT_LIMIT) break;
  }
  return picked.length ? picked : TIMER_PRESETS.slice(0, RECENT_LIMIT);
}
