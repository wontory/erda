import { ErrorRow } from "@erda/ui/components/error-row";
import { startPlatform } from "@erda/ui/lib/platform";
import { setSpriteFetcher } from "@erda/ui/lib/sprite-fetcher";

import "@erda/ui/styles.css";
import { startSystemTheme } from "@erda/ui/lib/theme";
import { invoke } from "@tauri-apps/api/core";
import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

import { ErrorBoundary, type ErrorFallback } from "./error-boundary.tsx";

const defaultFallback: ErrorFallback = (_error, reset) => (
  <div className="p-3">
    <ErrorRow message="화면을 표시하지 못했어요" onRetry={reset} />
  </div>
);

export function mountRoot(Root: ComponentType, fallback: ErrorFallback = defaultFallback) {
  startSystemTheme();
  setSpriteFetcher(async (url) => {
    const bytes = await invoke<ArrayBuffer | number[]>("nexon_character_look", { url });
    return bytes instanceof ArrayBuffer ? bytes : new Uint8Array(bytes).buffer;
  });
  void startPlatform();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary fallback={fallback}>
        <Root />
      </ErrorBoundary>
    </StrictMode>,
  );
}
