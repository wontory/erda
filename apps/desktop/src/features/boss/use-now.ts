import { nextReset } from "@erda/core";
import { useEffect, useState } from "react";

export function nextTickDelay(now: Date, maxMs: number): number {
  const untilBoundary = nextReset("daily", now).getTime() - now.getTime() + 50;
  return Math.max(0, Math.min(maxMs, untilBoundary));
}

export function useNow(maxIntervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setTimeout(() => setNow(new Date()), nextTickDelay(now, maxIntervalMs));
    return () => clearTimeout(t);
  }, [now, maxIntervalMs]);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return now;
}
