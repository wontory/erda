import { ChevronLeft, Settings } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "#/components/ui/button.tsx";

function backShortcut() {
  const isWindows = typeof document !== "undefined" && document.documentElement.dataset.platform === "windows";
  return isWindows ? "Ctrl+[" : "⌘[";
}

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  onSettings?: () => void;
};

export function ScreenHeader({ title, subtitle, onBack, leading, trailing, onSettings }: ScreenHeaderProps) {
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
        <div className="min-w-0 flex-1 px-1">
          <h1
            tabIndex={-1}
            data-screen-title
            className="m-0 truncate text-[15px] leading-tight font-semibold outline-none"
          >
            {title}
          </h1>
          {subtitle ? <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div> : null}
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
