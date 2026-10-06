import { useEffect, useReducer } from "react";
import { z } from "zod";

import { useTauriEvent } from "#/lib/use-tauri-event.ts";

export const HUD_MOTION_MS = 160;

export const hudRowSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("timer"),
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    color: z.string(),
    remaining: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal("finished"), id: z.string(), name: z.string(), icon: z.string(), color: z.string() }),
  z.object({
    kind: z.literal("notice"),
    id: z.string(),
    title: z.string(),
    category: z.string(),
    maintenance: z.boolean(),
  }),
]);
export type HudRow = z.infer<typeof hudRowSchema>;

const hudRowsSchema = z.array(hudRowSchema);

export function hudCardKey(row: HudRow): string {
  return row.kind === "finished" ? row.id.replace(/^done-/, "") : row.id;
}

export interface HudState {
  rows: HudRow[];
  leaving: boolean;
}
type HudAction = { type: "rows"; rows: HudRow[] } | { type: "cleared" };

export function hudReducer(state: HudState, action: HudAction): HudState {
  switch (action.type) {
    case "rows":
      if (action.rows.length > 0) return { rows: action.rows, leaving: false };
      return state.rows.length === 0 ? state : { rows: state.rows, leaving: true };
    case "cleared":
      return { rows: [], leaving: false };
  }
}

const EMPTY_HUD: HudState = { rows: [], leaving: false };

export function useHudRows(): HudState {
  const [state, dispatch] = useReducer(hudReducer, EMPTY_HUD);
  useTauriEvent("hud:rows", hudRowsSchema, (rows) => dispatch({ type: "rows", rows }));
  useEffect(() => {
    if (!state.leaving) return;
    const t = setTimeout(() => dispatch({ type: "cleared" }), HUD_MOTION_MS);
    return () => clearTimeout(t);
  }, [state.leaving]);
  return state;
}
