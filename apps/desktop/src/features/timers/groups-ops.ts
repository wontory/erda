import type { TimerGroup } from "@erda/core";

export const upsertGroup = (list: TimerGroup[], group: TimerGroup): TimerGroup[] =>
  list.some((g) => g.id === group.id) ? list.map((g) => (g.id === group.id ? group : g)) : [...list, group];

export const removeGroup = (list: TimerGroup[], id: string): TimerGroup[] => list.filter((g) => g.id !== id);

export function moveById<T extends { id: string }>(list: T[], id: string, delta: number): T[] {
  const from = list.findIndex((g) => g.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const moveGroup = (list: TimerGroup[], id: string, delta: number): TimerGroup[] => moveById(list, id, delta);
