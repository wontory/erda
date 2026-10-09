import type {
  PotentialCandidate,
  PotentialGoal,
  PotentialGrade,
  PotentialTarget,
  StarforceCandidate,
  StarforceItem,
  StarforceOptions,
} from "@erda/core";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { QueryClientProvider } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { emitTo } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

import { AutoSheet as PotentialAutoSheet } from "#/app/pages/simulators/potential/auto-sheet.tsx";
import { InfoSheet as PotentialInfoSheet } from "#/app/pages/simulators/potential/info-sheet.tsx";
import { ItemSheet as PotentialItemSheet, type ItemDraft } from "#/app/pages/simulators/potential/item-sheet.tsx";
import { usePotentialData } from "#/app/pages/simulators/potential/use-potential-data.ts";
import { AutoSheet as StarforceAutoSheet } from "#/app/pages/simulators/starforce/auto-sheet.tsx";
import { InfoSheet as StarforceInfoSheet } from "#/app/pages/simulators/starforce/info-sheet.tsx";
import { ItemSheet as StarforceItemSheet } from "#/app/pages/simulators/starforce/item-sheet.tsx";
import { OptionsSheet as StarforceOptionsSheet } from "#/app/pages/simulators/starforce/options-sheet.tsx";
import { SF_THEME } from "#/app/pages/simulators/starforce/theme.ts";
import { sheetContentSchema, type EquippedView, type SheetContent } from "#/features/sheet/protocol.ts";
import { queryClient } from "#/lib/query.ts";
import { useFitWindowHeight } from "#/lib/use-fit-window-height.ts";
import { useTauriEvent } from "#/lib/use-tauri-event.ts";

import { SheetCloseContext } from "./sheet-close.ts";

type Send = (type: string, value?: unknown) => void;

const USER_FOCUS_WINDOW_MS = 500;

let queue: Promise<unknown> = Promise.resolve();
const enqueue = (task: () => Promise<unknown>) => {
  queue = queue.then(task).catch(console.error);
};

function PotentialAuto({
  props,
  send,
  close,
}: {
  props: { target: PotentialTarget; current: PotentialGrade; goal: PotentialGoal };
  send: Send;
  close: () => void;
}) {
  const data = usePotentialData();
  if (!data.data) return <LoadingRow label="옵션표 불러오는 중…" />;
  return (
    <PotentialAutoSheet
      data={data.data}
      {...props}
      onClose={close}
      onStart={(goal, times) => send("start", { goal, times })}
    />
  );
}

function SheetView({ content, send, close }: { content: SheetContent; send: Send; close: () => void }) {
  const props = content.props as never;
  switch (content.kind) {
    case "potential-item": {
      const p = props as { initial: ItemDraft; equipped: EquippedView<PotentialCandidate> };
      return <PotentialItemSheet {...p} onClose={close} onApply={(draft) => send("apply", draft)} />;
    }
    case "potential-auto":
      return <PotentialAuto props={props} send={send} close={close} />;
    case "potential-info":
      return <PotentialInfoSheet {...(props as { dataDate: string })} />;
    case "starforce-item": {
      const p = props as {
        item: StarforceItem | null;
        level: number;
        startStar: number;
        equipped: EquippedView<StarforceCandidate>;
      };
      return (
        <StarforceItemSheet
          {...p}
          onClose={close}
          onApply={(item, level, startStar) => send("apply", { item, level, startStar })}
        />
      );
    }
    case "starforce-options": {
      const p = props as { options: StarforceOptions; sparePrice: number };
      return (
        <StarforceOptionsSheet
          {...p}
          onOptions={(options) => send("options", options)}
          onSparePrice={(price) => send("sparePrice", price)}
        />
      );
    }
    case "starforce-auto": {
      const p = props as { star: number; cap: number; target: number; protectStars: number[] };
      return (
        <StarforceAutoSheet {...p} onClose={close} onStart={(target, protect) => send("start", { target, protect })} />
      );
    }
    case "starforce-info":
      return <StarforceInfoSheet />;
  }
}

export function SheetApp() {
  const [content, setContent] = useState<SheetContent | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  useFitWindowHeight(frameRef);
  useTauriEvent("sheet:content", sheetContentSchema, setContent);
  const id = content?.id ?? null;
  const close = () => {
    if (id !== null) enqueue(() => invoke("sheet_hide", { id }));
  };
  const send: Send = (type, value) => {
    if (id !== null) enqueue(() => emitTo("main", "sheet:result", { id, type, value: value ?? null }));
  };
  useEffect(() => {
    let lastInput = 0;
    const mark = () => {
      lastInput = performance.now();
    };
    const onFocusIn = (e: FocusEvent) => {
      if (performance.now() - lastInput > USER_FOCUS_WINDOW_MS && e.target instanceof HTMLElement) e.target.blur();
    };
    window.addEventListener("pointerdown", mark, true);
    window.addEventListener("keydown", mark, true);
    window.addEventListener("focusin", onFocusIn, true);
    return () => {
      window.removeEventListener("pointerdown", mark, true);
      window.removeEventListener("keydown", mark, true);
      window.removeEventListener("focusin", onFocusIn, true);
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || id === null) return;
      e.preventDefault();
      enqueue(() => invoke("sheet_hide", { id }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id]);
  return (
    <QueryClientProvider client={queryClient}>
      <SheetCloseContext value={close}>
        <div
          ref={frameRef}
          style={SF_THEME}
          className="w-screen overflow-hidden rounded-[var(--panel-radius)] bg-panel-scrim text-foreground"
        >
          {content ? <SheetView key={content.id} content={content} send={send} close={close} /> : null}
        </div>
      </SheetCloseContext>
    </QueryClientProvider>
  );
}
