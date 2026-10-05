import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"output">) {
  return (
    <output
      data-slot="spinner"
      aria-label="불러오는 중"
      className={cn("inline-flex size-4 shrink-0", className)}
      {...props}
    >
      <Loader2Icon aria-hidden className="size-full animate-spin" />
    </output>
  );
}

export { Spinner };
