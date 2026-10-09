import { z } from "zod";

export const SHEET_KINDS = [
  "starforce-item",
  "starforce-options",
  "starforce-auto",
  "starforce-info",
] as const;
export type SheetKind = (typeof SHEET_KINDS)[number];

export const sheetContentSchema = z.object({ id: z.number(), kind: z.enum(SHEET_KINDS), props: z.unknown() });
export type SheetContent = z.infer<typeof sheetContentSchema>;

export const sheetResultSchema = z.object({ id: z.number(), type: z.string(), value: z.unknown() });
export type SheetResult = z.infer<typeof sheetResultSchema>;

export const sheetClosedSchema = z.object({ id: z.number() });

export interface EquippedView<C> {
  owner: string | null;
  candidates: C[];
  isPending: boolean;
  error: string | null;
}
