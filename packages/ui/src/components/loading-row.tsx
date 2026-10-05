import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

export function LoadingRow({
  label = "불러오는 중…",
  minHeight,
  className,
}: {
  label?: string;
  minHeight?: number;
  className?: string;
}) {
  return (
    <output
      className={cn(
        "flex animate-in items-center gap-2 px-2 py-1 text-muted-foreground delay-150 duration-150 fill-mode-backwards fade-in",
        className,
      )}
      style={minHeight ? { minHeight } : undefined}
    >
      <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
      <span className="text-[12px]">{label}</span>
    </output>
  );
}
