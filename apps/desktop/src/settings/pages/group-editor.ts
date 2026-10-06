import { shortNameOf, type TimerGroup, type TimerGroupEntry } from "@erda/core";

export const newGroup = (): TimerGroup => ({ id: `group-${Date.now()}`, name: "", entries: [] });
export const makeEntryId = () => `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
export const groupValid = (g: TimerGroup) => g.name.trim().length > 0 && g.entries.length > 0;
export const addEntry = (g: TimerGroup, entry: TimerGroupEntry): TimerGroup => ({
  ...g,
  entries: [...g.entries, entry],
});
export const patchEntry = (g: TimerGroup, id: string, patch: Partial<TimerGroupEntry>): TimerGroup => ({
  ...g,
  entries: g.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
});
export const removeEntry = (g: TimerGroup, id: string): TimerGroup => ({
  ...g,
  entries: g.entries.filter((e) => e.id !== id),
});
export const renameEntry = (g: TimerGroup, id: string, name: string): TimerGroup => ({
  ...g,
  entries: g.entries.map((e) =>
    e.id === id ? { ...e, name, ...(e.presetId === undefined ? { shortName: shortNameOf(name) } : {}) } : e,
  ),
});
