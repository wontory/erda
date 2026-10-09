import { invoke } from "@tauri-apps/api/core";
import { useEffect, useEffectEvent, useState } from "react";

import { useTauriEvent } from "#/lib/use-tauri-event.ts";

import { sheetClosedSchema, sheetResultSchema, type SheetKind } from "./protocol.ts";

let lastId = Date.now();
const pendingHide = new Map<number, number>();

export function SideSheet({
  kind,
  props,
  onResult,
  onClose,
}: {
  kind: SheetKind;
  props: unknown;
  onResult?: (type: string, value: unknown) => void;
  onClose: () => void;
}) {
  const [id] = useState(() => ++lastId);
  const json = JSON.stringify(props ?? null);
  useEffect(() => {
    void invoke("sheet_show", { id, payload: { id, kind, props: JSON.parse(json) } }).catch(console.error);
  }, [id, kind, json]);
  useEffect(() => {
    window.clearTimeout(pendingHide.get(id));
    pendingHide.delete(id);
    return () => {
      const timer = window.setTimeout(() => {
        pendingHide.delete(id);
        void invoke("sheet_hide", { id }).catch(console.error);
      }, 0);
      pendingHide.set(id, timer);
    };
  }, [id]);
  const closeOnPointer = useEffectEvent(onClose);
  useEffect(() => {
    const onDown = () => closeOnPointer();
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("focus", onDown);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("focus", onDown);
    };
  }, []);
  useTauriEvent("sheet:result", sheetResultSchema, (r) => {
    if (r.id === id) onResult?.(r.type, r.value);
  });
  useTauriEvent("sheet:closed", sheetClosedSchema, (c) => {
    if (c.id === id) onClose();
  });
  return null;
}
