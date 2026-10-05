export type RawRecord = Record<string, unknown>;

export const asRecord = (raw: unknown): RawRecord => (raw && typeof raw === "object" ? (raw as RawRecord) : {});

export const recordList = (value: unknown): RawRecord[] => (Array.isArray(value) ? (value as RawRecord[]) : []);

export function stringField(record: object, key: string): string {
  const value = (record as RawRecord)[key];
  return typeof value === "string" ? value : "";
}

export function numberField(record: object, key: string): number | null {
  const value = (record as RawRecord)[key];
  return typeof value === "number" ? value : null;
}
