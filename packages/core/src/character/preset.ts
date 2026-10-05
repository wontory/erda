export function presetNumbers(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

export function presetNo(raw: unknown, count: number): string | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= count ? String(n) : null;
}

type MaybeList<T> = readonly T[] | null | undefined;

export function matchingPreset<T>(
  current: MaybeList<T>,
  presets: ReadonlyArray<MaybeList<T>>,
  key: (item: T) => string,
): string | null {
  const sig = (list: MaybeList<T>) => (list ?? []).map(key).toSorted().join("\n");
  const want = sig(current);
  if (want === "") return null;
  const i = presets.findIndex((p) => sig(p) === want);
  return i >= 0 ? String(i + 1) : null;
}
