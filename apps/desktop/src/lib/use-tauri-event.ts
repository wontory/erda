import { listen } from "@tauri-apps/api/event";
import { useEffect, useEffectEvent } from "react";
import { z, type ZodType } from "zod";

export function useTauriEvent<T>(name: string, schema: ZodType<T>, handler: (payload: T) => void): void {
  const onEvent = useEffectEvent(handler);
  useEffect(() => {
    let cancelled = false;
    let off: (() => void) | undefined;
    listen<unknown>(name, (e) => {
      if (cancelled) return;
      const parsed = schema.safeParse(e.payload);
      if (parsed.success) onEvent(parsed.data);
      else console.error(`${name} payload rejected`, parsed.error);
    })
      .then((unlisten) => {
        if (cancelled) unlisten();
        else off = unlisten;
      })
      .catch((e) => console.error(`listen ${name} failed`, e));
    return () => {
      cancelled = true;
      off?.();
    };
  }, [name, schema]);
}

const anyPayload = z.unknown();

export function useTauriSignal(name: string, handler: () => void): void {
  useTauriEvent(name, anyPayload, handler);
}
