import { useId, type ReactNode } from "react";

import type { InspectorPayload } from "#/features/inspector/payload.ts";
import type { useInspector } from "#/features/inspector/use-inspector.ts";

type Inspector = ReturnType<typeof useInspector>;

export function Inspectable({
  inspector,
  payload,
  children,
}: {
  inspector: Inspector;
  payload: InspectorPayload;
  children: ReactNode;
}) {
  const hintId = useId();
  return (
    <>
      <button
        type="button"
        aria-describedby={hintId}
        onMouseEnter={() => inspector.hover(payload)}
        onMouseLeave={inspector.leave}
        onClick={() => inspector.toggle(payload)}
        className="block w-full rounded-lg text-left transition-colors duration-100 hover:bg-glass-card-hover focus-visible:outline-2"
      >
        {children}
      </button>
      <span id={hintId} className="sr-only">
        옆 창에 상세 보기
      </span>
    </>
  );
}
