import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useRef, useState } from "react";

import { errorMessage } from "#/lib/action.ts";

export type UpdateState =
  | { status: "idle" | "checking" | "latest" }
  | { status: "available"; update: Update }
  | { status: "installing"; update: Update; progress: number | null }
  | { status: "error"; message: string; update: Update | null };

const RECHECK_MS = 6 * 60 * 60 * 1000;
// Lets the startup API calls go first.
const FIRST_CHECK_DELAY_MS = 3000;

// The last background result, so screens that mount again (home) don't hit the feed every time.
let lastQuietCheck = 0;
let lastFound: Update | null = null;

// Checks the release feed and installs the update in place, then restarts the app.
// `auto` checks once on mount and again every few hours, quietly: a failed background check isn't an error.
export function useAppUpdate({ auto = false }: { auto?: boolean } = {}) {
  const [state, setState] = useState<UpdateState>(() =>
    auto && lastFound ? { status: "available", update: lastFound } : { status: "idle" },
  );
  const busy = useRef(false);

  const runCheck = useCallback(async (quiet: boolean) => {
    if (busy.current) return;
    if (quiet && Date.now() - lastQuietCheck < RECHECK_MS) return;
    busy.current = true;
    if (!quiet) setState({ status: "checking" });
    try {
      const update = await check();
      lastQuietCheck = Date.now();
      lastFound = update;
      setState(update ? { status: "available", update } : quiet ? { status: "idle" } : { status: "latest" });
    } catch (e) {
      console.error("update check failed", e);
      if (!quiet) setState({ status: "error", message: errorMessage(e), update: null });
    } finally {
      busy.current = false;
    }
  }, []);

  const install = useCallback(async (update: Update) => {
    if (busy.current) return;
    busy.current = true;
    let total = 0;
    let received = 0;
    setState({ status: "installing", update, progress: null });
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") {
          received += event.data.chunkLength;
          setState({ status: "installing", update, progress: total > 0 ? Math.min(1, received / total) : null });
        }
      });
      await relaunch();
    } catch (e) {
      console.error("update install failed", e);
      setState({ status: "error", message: errorMessage(e), update });
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const first = window.setTimeout(() => void runCheck(true), FIRST_CHECK_DELAY_MS);
    const id = window.setInterval(() => void runCheck(true), RECHECK_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [auto, runCheck]);

  return { state, check: () => runCheck(false), install };
}
