import { Star } from "lucide-react";
import type { ReactNode } from "react";

// A star count drawn with the Star icon, sized to the surrounding text.
export function StarCount({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.15em] tabular-nums ${className}`}>
      <Star aria-hidden className="size-[0.85em] shrink-0 fill-current" strokeWidth={0} />
      {children}
    </span>
  );
}
