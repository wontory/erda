import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";

import { NavContext, type NavApi, type NavVia } from "./context.ts";
import { clearLastPage, persistTopPage, readLastPage } from "./persist.ts";
import { HOME, navReducer, type NavAction, type Page } from "./stack.ts";

type State = { stack: Page[]; direction: "forward" | "back"; via: NavVia };
type Action = NavAction & { via: NavVia };
type Dispatch = (action: Action) => void;

const INITIAL: State = { stack: [HOME], direction: "forward", via: "restore" };

const reduce = (s: State, a: Action): State => ({
  stack: navReducer(s.stack, a),
  direction: a.type === "push" ? "forward" : "back",
  via: a.via,
});

const userVia = (via?: NavVia): NavVia => (via === "keyboard" ? via : "pointer");

function useRestoreLastPage(stack: Page[], dispatch: Dispatch): boolean {
  const [restored, setRestored] = useState(false);
  const stackRef = useRef(stack);
  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);
  useEffect(() => {
    let cancelled = false;
    void readLastPage().then((page) => {
      if (cancelled) return;
      if (page && stackRef.current.length <= 1) dispatch({ type: "restore", page, via: "restore" });
      setRestored(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
  return restored;
}

function usePersistTopPage(current: Page, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (current.kind === "home") void clearLastPage();
    else void persistTopPage(current);
  }, [enabled, current]);
}

function isBackShortcut(e: KeyboardEvent): boolean {
  const inField = (e.target as HTMLElement | null)?.closest("input, textarea");
  return (e.key === "Escape" && !inField) || (e.key === "[" && (e.metaKey || e.ctrlKey));
}

function useBackShortcut(api: NavApi) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isBackShortcut(e) || !api.canGoBack) return;
      e.preventDefault();
      api.pop("keyboard");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api]);
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, INITIAL);

  const api = useMemo<NavApi>(
    () => ({
      stack: state.stack,
      current: state.stack[state.stack.length - 1],
      direction: state.direction,
      via: state.via,
      canGoBack: state.stack.length > 1,
      push: (page, via) => dispatch({ type: "push", page, via: userVia(via) }),
      pop: (via) => dispatch({ type: "pop", via: userVia(via) }),
      restore: (page) => dispatch({ type: "restore", page, via: "restore" }),
    }),
    [state],
  );

  const restored = useRestoreLastPage(state.stack, dispatch);
  usePersistTopPage(api.current, restored);
  useBackShortcut(api);

  return <NavContext.Provider value={api}>{children}</NavContext.Provider>;
}
