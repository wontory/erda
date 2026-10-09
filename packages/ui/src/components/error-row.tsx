import { AlertCircle } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";

export function ErrorRow({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-8 animate-in items-center gap-2 px-2 py-1 text-destructive duration-150 fade-in"
    >
      <AlertCircle aria-hidden className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 text-[12px] leading-snug wrap-break-word">{message}</span>
      {onRetry ? (
        <Button variant="outline" className="shrink-0 text-foreground" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}
