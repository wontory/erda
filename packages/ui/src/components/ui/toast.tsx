import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";
import { XIcon } from "lucide-react";

import { toastManager } from "#/lib/toast.ts";

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      swipeDirection="down"
      data-slot="toast"
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-2 rounded-xl border border-border bg-popover/85 py-2 pr-1.5 pl-3 text-[13px] text-popover-foreground shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl outline-none select-none",
        "translate-y-[var(--toast-swipe-movement-y)] transition-[opacity,translate,scale] duration-200 ease-out",
        "data-starting-style:translate-y-2 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
        "data-ending-style:translate-y-2 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:duration-150",
        "data-limited:hidden data-swiping:transition-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "motion-reduce:transition-opacity motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-starting-style:scale-100",
      )}
    >
      <ToastPrimitive.Content className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
        <ToastPrimitive.Title
          data-slot="toast-title"
          className="leading-snug font-medium in-data-[type=error]:text-destructive"
        />
        <ToastPrimitive.Description
          data-slot="toast-description"
          className="text-[12px] leading-snug text-muted-foreground"
        />
      </ToastPrimitive.Content>
      <ToastPrimitive.Close
        aria-label="닫기"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 outline-none hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5"
      >
        <XIcon />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ));
}

function Toaster({ limit = 3, timeout = 4000 }: { limit?: number; timeout?: number }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} limit={limit} timeout={timeout}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          className="pointer-events-none fixed inset-x-0 bottom-3 z-[60] mx-auto flex w-[calc(100%-1.5rem)] max-w-[360px] flex-col-reverse gap-2 outline-none"
        >
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

export { Toaster };
