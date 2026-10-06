export function resolvePreset(selected: string | null, current: string | null) {
  const active = selected ?? current ?? "1";
  return { active, worn: selected === null || active === current };
}

export function presetAt<T>(active: string, presets: readonly T[]): T {
  return presets[Number(active) - 1];
}
