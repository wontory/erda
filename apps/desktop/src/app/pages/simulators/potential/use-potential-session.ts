import {
  POTENTIAL_KINDS,
  autoShouldStop,
  autoStep,
  reachesGoal,
  tripleAllowed,
  supportsKind,
  choosePotential,
  initialPotentialState,
  resetPotential,
  type PotentialChoice,
  type PotentialData,
  type PotentialGoal,
  type PotentialKind,
  type PotentialSettings,
  type PotentialState,
  type PotentialTarget,
} from "@erda/core";
import { useCallback, useEffect, useMemo, useReducer } from "react";

import { randomSeed, seededRng } from "./random.ts";

const AUTO_INTERVAL_MS = 40;
const AUTO_BATCH = 4;
export const AUTO_LIMIT = 100_000;

export interface SessionConfig {
  part: number;
  level: number;
  soulStep: number;
}

export const targetOf = (config: SessionConfig, kind: PotentialKind): PotentialTarget => ({
  kind,
  part: config.part,
  level: config.level,
  soulStep: config.soulStep,
});

type States = Record<PotentialKind, PotentialState | null>;

export interface LastReset {
  kind: PotentialKind;
  id: number;
  upgraded: boolean;
}

interface Session {
  config: SessionConfig;
  states: States;
  last: LastReset | null;
  auto: { kind: PotentialKind; goal: PotentialGoal; times: number; count: number } | null;
  stoppedAtLimit: boolean;
  concealed: { kind: PotentialKind; indices: number[] } | null;
}

type Action =
  | { type: "reset"; kind: PotentialKind; times: number; seed: number }
  | { type: "choose"; kind: PotentialKind; choice: PotentialChoice }
  | { type: "reveal"; kind: PotentialKind; index: number }
  | { type: "auto-step"; seed: number }
  | { type: "auto"; kind: PotentialKind; goal: PotentialGoal | null; times?: number }
  | { type: "restart"; settings: PotentialSettings; seed: number };

function build(data: PotentialData, settings: PotentialSettings, seed: number): Session {
  const config = { part: settings.part, level: settings.level, soulStep: settings.soulStep };
  const rng = seededRng(seed);
  const states = {} as States;
  for (const kind of POTENTIAL_KINDS) {
    states[kind] = initialPotentialState(data, targetOf(config, kind), settings.start[kind], rng);
  }
  return { config, states, last: null, auto: null, stoppedAtLimit: false, concealed: null };
}

function makeReducer(data: PotentialData) {
  return (session: Session, action: Action): Session => {
    switch (action.type) {
      case "reset": {
        const state = session.states[action.kind];
        const target = targetOf(session.config, action.kind);
        const next = state && resetPotential(state, data, target, seededRng(action.seed), action.times);
        if (!next) return session;
        return {
          ...session,
          states: { ...session.states, [action.kind]: next },
          last: { kind: action.kind, id: (session.last?.id ?? 0) + 1, upgraded: next.pending.some((p) => p.upgraded) },
          stoppedAtLimit: false,
          concealed: null,
        };
      }
      case "choose": {
        const state = session.states[action.kind];
        if (!state) return session;
        return {
          ...session,
          states: { ...session.states, [action.kind]: choosePotential(state, action.choice) },
          concealed: null,
        };
      }
      case "reveal": {
        if (session.concealed?.kind !== action.kind) return session;
        const indices = session.concealed.indices.filter((i) => i !== action.index);
        return { ...session, concealed: indices.length > 0 ? { kind: action.kind, indices } : null };
      }
      case "auto-step": {
        if (!session.auto) return session;
        const { kind, goal } = session.auto;
        let state = session.states[kind];
        if (!state) return { ...session, auto: null };
        const target = targetOf(session.config, kind);
        const rng = seededRng(action.seed);
        let count = session.auto.count;
        let done = false;
        for (let i = 0; i < AUTO_BATCH && !done && count < AUTO_LIMIT; i++) {
          const times = tripleAllowed(kind, state.current.grade, state.pity) ? session.auto.times : 1;
          const rolled = resetPotential(state, data, target, rng, times);
          if (!rolled) {
            done = true;
            break;
          }
          const step = autoStep(rolled, goal);
          state = step.state;
          done = step.done;
          count += times;
        }
        const limited = !done && count >= AUTO_LIMIT;
        const indices = done ? state.pending.flatMap((p, i) => (reachesGoal(p, goal) ? [i] : [])) : [];
        return {
          ...session,
          states: { ...session.states, [kind]: state },
          last: null,
          auto: done || limited ? null : { ...session.auto, count },
          stoppedAtLimit: limited,
          concealed: indices.length > 0 ? { kind, indices } : session.concealed,
        };
      }
      case "auto": {
        if (!action.goal) return { ...session, auto: null };
        const state = session.states[action.kind];
        if (!state) return session;
        const done = autoShouldStop(state, action.goal);
        return {
          ...session,
          last: null,
          auto: done ? null : { kind: action.kind, goal: action.goal, times: action.times ?? 1, count: 0 },
          stoppedAtLimit: false,
          concealed: null,
        };
      }
      case "restart":
        return build(data, action.settings, action.seed);
    }
  };
}

export function usePotentialSession(data: PotentialData, settings: PotentialSettings, wanted: PotentialKind) {
  const reducer = useMemo(() => makeReducer(data), [data]);
  const [session, dispatch] = useReducer(reducer, null, () => build(data, settings, randomSeed()));
  const kind = supportsKind(wanted, session.config.part) ? wanted : "main";

  const reset = useCallback((times: number) => dispatch({ type: "reset", kind, times, seed: randomSeed() }), [kind]);
  const choose = useCallback((choice: PotentialChoice) => dispatch({ type: "choose", kind, choice }), [kind]);
  const restart = useCallback(
    (next: PotentialSettings) => dispatch({ type: "restart", settings: next, seed: randomSeed() }),
    [],
  );
  const startAuto = useCallback(
    (goal: PotentialGoal, times: number) => dispatch({ type: "auto", kind, goal, times }),
    [kind],
  );
  const stopAuto = useCallback(() => dispatch({ type: "auto", kind, goal: null }), [kind]);
  const reveal = useCallback((index: number) => dispatch({ type: "reveal", kind, index }), [kind]);

  const autoKind = session.auto?.kind ?? null;
  const autoCount = session.auto?.count ?? 0;
  useEffect(() => {
    if (!autoKind) return;
    const id = setTimeout(() => dispatch({ type: "auto-step", seed: randomSeed() }), AUTO_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [autoKind, autoCount]);

  return {
    kind,
    config: session.config,
    state: session.states[kind],
    last: session.last?.kind === kind ? session.last : null,
    auto: autoKind === kind,
    autoElsewhere: autoKind !== null && autoKind !== kind,
    stoppedAtLimit: session.stoppedAtLimit,
    concealed: session.concealed?.kind === kind ? session.concealed.indices : [],
    reveal,
    reset,
    choose,
    restart,
    startAuto,
    stopAuto,
  };
}
