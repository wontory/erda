import { Module } from "@erda/ui/components/module";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { ScrollArea } from "@erda/ui/components/ui/scroll-area";
import { cn } from "@erda/ui/lib/utils";
import { XIcon } from "lucide-react";
import { Children, isValidElement, use, type ReactElement, type ReactNode } from "react";

import { SheetCloseContext } from "./sheet-close.ts";

export function SheetLayout({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex max-h-[640px] flex-col", className)}>{children}</div>;
}

export function SheetTitle({ children }: { children: string }) {
  return <>{children}</>;
}

export function SheetDescription({ children }: { children: ReactNode }) {
  return <p className="m-0 px-3.5 pb-2 text-[12px] break-keep text-muted-foreground">{children}</p>;
}

export function SheetHeader({ children }: { children: ReactNode }) {
  const close = use(SheetCloseContext);
  const parts = Children.toArray(children).filter(isValidElement) as ReactElement<{ children: ReactNode }>[];
  const title = parts.find((p) => p.type === SheetTitle)?.props.children;
  const rest = parts.filter((p) => p.type !== SheetTitle);
  return (
    <div className="shrink-0">
      <ScreenHeader
        title={typeof title === "string" ? title : undefined}
        trailing={
          <Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기 (Esc)" onClick={close}>
            <XIcon />
          </Button>
        }
      />
      {rest}
    </div>
  );
}

// Fades the content into the header and footer only while more of it is
// scrolled out of view on that side, growing with the remaining distance.
const SCROLL_FADE =
  "mask-linear-[to_bottom,transparent_0,black_min(24px,var(--scroll-area-overflow-y-start,0px)),black_calc(100%_-_min(24px,var(--scroll-area-overflow-y-end,0px))),transparent_100%] mask-no-repeat";

export function SheetBody({ children }: { children: ReactNode }) {
  return (
    <ScrollArea
      className="flex min-h-0 flex-1 flex-col"
      viewportClassName={`min-h-0 flex-1 px-3 pb-3 focus-visible:ring-inset focus-visible:outline-offset-[-1px] ${SCROLL_FADE}`}
    >
      <Module>{children}</Module>
    </ScrollArea>
  );
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 gap-2 px-3 pb-3 *:h-10 *:flex-1 *:text-[14px]">{children}</div>;
}
