import { useRef, useState } from "react";

import { ItemDetail } from "#/app/pages/character/inspector/item-detail.tsx";
import { SymbolDetail } from "#/app/pages/character/inspector/symbol-detail.tsx";
import { TitleDetail } from "#/app/pages/character/inspector/title-detail.tsx";
import { inspectorPayloadSchema, type InspectorPayload } from "#/features/inspector/payload.ts";
import { useFitWindowHeight } from "#/lib/use-fit-window-height.ts";
import { useTauriEvent } from "#/lib/use-tauri-event.ts";

function InspectorDetail({ payload }: { payload: InspectorPayload }) {
  switch (payload.kind) {
    case "item":
      return <ItemDetail item={payload.item} />;
    case "symbol":
      return <SymbolDetail payload={payload} />;
    case "title":
      return <TitleDetail title={payload.title} />;
  }
}

export function InspectorApp() {
  const [payload, setPayload] = useState<InspectorPayload | null>(null);
  useTauriEvent("inspector:content", inspectorPayloadSchema, setPayload);
  const frameRef = useRef<HTMLDivElement>(null);
  useFitWindowHeight(frameRef);
  return (
    <div ref={frameRef} className="w-screen overflow-hidden rounded-[var(--panel-radius)] bg-panel-scrim text-[12px]">
      <div className="scrollbar-none max-h-[640px] overflow-y-auto">
        {payload ? (
          <div className="animate-in p-3 duration-150 ease-out fade-in">
            <InspectorDetail payload={payload} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
