import { AlertCircle } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";

export function ErrorRow({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex animate-in items-start gap-2 px-2 py-1 text-destructive duration-150 fade-in">
      <AlertCircle size={15} aria-hidden className="mt-px shrink-0" />
      <span className="min-w-0 flex-1 text-[12px] leading-snug wrap-break-word">{message}</span>
      {onRetry ? (
        <Button variant="outline" size="xs" className="shrink-0" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}
