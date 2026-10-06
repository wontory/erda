import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

import { useTauriSignal } from "#/lib/use-tauri-event.ts";

import type { InspectorPayload } from "./payload.ts";
import { claimsEscape, INITIAL, inspectorReducer, type InspectorEvent, type InspectorState } from "./state.ts";

const OPEN_DELAY = 350;
const CLOSE_DELAY = 120;

const shared: { state: InspectorState; timer: number | null } = { state: INITIAL, timer: null };

function clearTimer() {
  if (!shared.timer) return;
  window.clearTimeout(shared.timer);
  shared.timer = null;
}

function schedule(fn: () => void, ms: number) {
  clearTimer();
  shared.timer = window.setTimeout(fn, ms);
}

function dispatch(event: InspectorEvent) {
  const next = inspectorReducer(shared.state, event);
  shared.state = next.state;
  if (next.effect === "show") void invoke("inspector_show", { payload: next.state.shown }).catch(console.error);
  if (next.effect === "hide") void invoke("inspector_hide").catch(console.error);
}

function dispatchNow(event: InspectorEvent) {
  clearTimer();
  dispatch(event);
}

export function useInspector() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !claimsEscape(shared.state)) return;
      dispatchNow({ type: "escape" });
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
      dispatchNow({ type: "panelHiding" });
    };
  }, []);

  useTauriSignal("panel:hiding", () => dispatchNow({ type: "panelHiding" }));

  return {
    hover: (payload: InspectorPayload) => {
      if (shared.state.shown && !shared.state.pinned) dispatchNow({ type: "hover", payload });
      else schedule(() => dispatch({ type: "hover", payload }), OPEN_DELAY);
    },
    leave: () => schedule(() => dispatch({ type: "leave" }), CLOSE_DELAY),
    toggle: (payload: InspectorPayload) => dispatchNow({ type: "toggle", payload }),
  };
}
