import { payloadKey, type InspectorPayload } from "./payload.ts";

export interface InspectorState {
  pinned: boolean;
  shown: InspectorPayload | null;
}

export type InspectorEvent =
  | { type: "hover"; payload: InspectorPayload }
  | { type: "leave" }
  | { type: "toggle"; payload: InspectorPayload }
  | { type: "escape" }
  | { type: "panelHiding" };

type InspectorEffect = "show" | "hide" | null;

export const INITIAL: InspectorState = { pinned: false, shown: null };

export const claimsEscape = (state: InspectorState) => state.shown !== null;

export function inspectorReducer(
  state: InspectorState,
  event: InspectorEvent,
): { state: InspectorState; effect: InspectorEffect } {
  switch (event.type) {
    case "hover":
      return state.pinned
        ? { state, effect: null }
        : { state: { pinned: false, shown: event.payload }, effect: "show" };
    case "leave":
      return state.pinned || !state.shown ? { state, effect: null } : { state: INITIAL, effect: "hide" };
    case "toggle": {
      const samePinned = state.pinned && state.shown && payloadKey(state.shown) === payloadKey(event.payload);
      if (samePinned) return { state: INITIAL, effect: "hide" };
      return { state: { pinned: true, shown: event.payload }, effect: "show" };
    }
    case "escape":
    case "panelHiding":
      return state.shown ? { state: INITIAL, effect: "hide" } : { state, effect: null };
  }
}
