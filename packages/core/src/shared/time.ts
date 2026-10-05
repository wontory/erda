export const DAY_MS = 86_400_000;

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export function ymdParts(ymd: string): [year: number, month: number, day: number] {
  const [year, month, day] = ymd.split("-").map(Number);
  return [year, month, day];
}
