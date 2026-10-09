import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "#/components/ui/button.tsx";

function backShortcut() {
  const isWindows = typeof document !== "undefined" && document.documentElement.dataset.platform === "windows";
  return isWindows ? "Ctrl+[" : "⌘[";
}

type ScreenHeaderProps = {
  title?: string;
  parent?: string;
  subtitle?: string;
  onBack?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  onSettings?: () => void;
};

export function ScreenHeader({ title, parent, subtitle, onBack, leading, trailing, onSettings }: ScreenHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-1 px-2">
      {onBack ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="뒤로"
          title={`뒤로 (${backShortcut()})`}
          onClick={() => onBack()}
        >
          <ChevronLeft />
        </Button>
      ) : null}
      {leading}
      {title ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 px-1 text-[15px] leading-tight">
          {parent ? (
            <>
              <span aria-hidden className="max-w-[45%] shrink-0 truncate text-muted-foreground">
                {parent}
              </span>
              <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            </>
          ) : null}
          <h1
            tabIndex={-1}
            data-screen-title
            className="m-0 min-w-0 shrink truncate text-[15px] font-semibold outline-none"
          >
            {parent ? <span className="sr-only">{parent} › </span> : null}
            {title}
          </h1>
          {subtitle ? (
            <span className="ml-1 min-w-0 flex-1 truncate text-[12px] text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>
      ) : null}
      {!title && !leading ? <div className="flex-1" /> : null}
      {trailing}
      {onSettings ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="설정"
          title="설정 열기 (아이콘 우클릭으로도 열 수 있어요)"
          onClick={onSettings}
        >
          <Settings />
        </Button>
      ) : null}
    </header>
  );
}
