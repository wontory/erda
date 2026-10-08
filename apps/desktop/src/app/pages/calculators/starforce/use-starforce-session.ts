import {
  enhance,
  initialStarforceState,
  restore,
  type EnhanceOutcome,
  type RestoreMode,
  type StarforceOptions,
  type StarforceSettings,
  type StarforceState,
} from "@erda/core";
import { useCallback, useReducer, useState } from "react";

import { randomRoll } from "./random-roll.ts";

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
}

type Action =
  | { type: "enhance"; options: StarforceOptions; protect: boolean; roll: number }
  | { type: "restore"; mode: RestoreMode; options: StarforceOptions }
  | { type: "reset"; level: number; star: number };

function reducer(session: Session, action: Action): Session {
  switch (action.type) {
    case "enhance": {
      const r = enhance(session.state, action.options, action.protect, action.roll);
      if (!r) return session;
      return {
        state: r.state,
        last: { outcome: r.outcome, from: r.from, to: r.to, id: (session.last?.id ?? 0) + 1 },
      };
    }
    case "restore":
      return { ...session, state: restore(session.state, action.mode, action.options) };
    case "reset":
      return { state: initialStarforceState(action.level, action.star), last: null };
  }
}

export function useStarforceSession(settings: StarforceSettings) {
  const [session, dispatch] = useReducer(reducer, settings, (s) => ({
    state: initialStarforceState(s.level, s.startStar),
    last: null,
  }));
  const [protect, setProtect] = useState(false);
  const { options } = settings;

  const attempt = useCallback(() => {
    dispatch({ type: "enhance", options, protect, roll: randomRoll() });
  }, [options, protect]);

  const restoreWith = useCallback((mode: RestoreMode) => dispatch({ type: "restore", mode, options }), [options]);

  const reset = useCallback((level: number, star: number) => dispatch({ type: "reset", level, star }), []);

  return {
    state: session.state,
    last: session.last,
    phase: "idle" as Phase,
    auto: false,
    protect,
    setProtect,
    attempt,
    restoreWith,
    reset,
    startAuto: () => {},
    stopAuto: () => {},
  };
}
