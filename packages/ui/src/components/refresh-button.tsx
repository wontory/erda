import { cn } from "cn";
import { RefreshCw } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";

export function RefreshButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="새로고침"
      title="새로고침"
      onClick={onClick}
      disabled={disabled || loading}
      focusableWhenDisabled
      aria-busy={loading || undefined}
      className={cn("active:bg-foreground/10", disabled && !loading && "opacity-50")}
    >
      <RefreshCw className={cn(loading && "animate-spin motion-reduce:animate-pulse")} />
    </Button>
  );
}
