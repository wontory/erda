import {
  enhance,
  initialStarforceState,
  restore,
  type EnhanceOutcome,
  type RestoreMode,
  type StarforceOptions,
  type StarforceSettings,
  type StarforceState,
  shouldStopAuto,
} from "@erda/core";
import { useCallback, useEffect, useReducer, useState } from "react";

import { randomRoll } from "./random-roll.ts";

const AUTO_INTERVAL_MS = 80;

export type Phase = "idle" | "charging" | "result";

export interface LastResult {
  outcome: EnhanceOutcome;
  from: number;
  to: number;
  id: number;
}

interface Session {
  state: StarforceState;
  last: LastResult | null;
  autoTarget: number | null;
}

type Action =
  | { type: "enhance"; options: StarforceOptions; protect: boolean; roll: number }
  | { type: "restore"; mode: RestoreMode; options: StarforceOptions }
  | { type: "reset"; level: number; star: number }
  | { type: "auto"; target: number | null };

// Auto stops in the same update that reaches the target or destroys the item.
const keepAuto = (state: StarforceState, target: number | null): number | null =>
  target !== null && !shouldStopAuto(state, target) ? target : null;

function reducer(session: Session, action: Action): Session {
  switch (action.type) {
    case "enhance": {
      const r = enhance(session.state, action.options, action.protect, action.roll);
      if (!r) return session;
      return {
        state: r.state,
        last: { outcome: r.outcome, from: r.from, to: r.to, id: (session.last?.id ?? 0) + 1 },
        autoTarget: keepAuto(r.state, session.autoTarget),
      };
    }
    case "restore":
      return { ...session, state: restore(session.state, action.mode, action.options) };
    case "reset":
      return { state: initialStarforceState(action.level, action.star), last: null, autoTarget: null };
    case "auto":
      return { ...session, autoTarget: keepAuto(session.state, action.target) };
  }
}

export function useStarforceSession(settings: StarforceSettings) {
  const [session, dispatch] = useReducer(reducer, settings, (s) => ({
    state: initialStarforceState(s.level, s.startStar),
    last: null,
    autoTarget: null,
  }));
  const [protect, setProtect] = useState(false);
  const { options } = settings;

  const attempt = useCallback(() => {
    dispatch({ type: "enhance", options, protect, roll: randomRoll() });
  }, [options, protect]);

  const restoreWith = useCallback((mode: RestoreMode) => dispatch({ type: "restore", mode, options }), [options]);

  const reset = useCallback((level: number, star: number) => dispatch({ type: "reset", level, star }), []);
  const startAuto = useCallback((target: number) => dispatch({ type: "auto", target }), []);
  const stopAuto = useCallback(() => dispatch({ type: "auto", target: null }), []);

  const auto = session.autoTarget !== null;
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => {
      dispatch({
        type: "enhance",
        options: settings.options,
        protect: settings.autoProtect.includes(session.state.star),
        roll: randomRoll(),
      });
    }, AUTO_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [auto, session.state, settings.autoProtect, settings.options]);

  return {
    state: session.state,
    last: session.last,
    phase: "idle" as Phase,
    auto,
    protect,
    setProtect,
    attempt,
    restoreWith,
    reset,
    startAuto,
    stopAuto,
  };
}
