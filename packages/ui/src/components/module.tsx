import { cn } from "cn";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ModuleProps = {
  title?: string;
  icon?: LucideIcon;
  onOpen?: () => void;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function Module({ title, icon: Icon, onOpen, trailing, children, className, titleClassName }: ModuleProps) {
  const titleClass = cn("flex-1 truncate", titleClassName);
  const header = title ? (
    <div className="flex h-8 items-center gap-2 px-3 text-[13px] font-semibold">
      {Icon ? <Icon size={14} strokeWidth={2.25} className="text-muted-foreground" /> : null}
      {onOpen ? (
        <span className={titleClass}>{title}</span>
      ) : (
        <h2 className={cn("m-0 text-[13px] font-semibold", titleClass)}>{title}</h2>
      )}
      {trailing}
      {onOpen ? <ChevronRight size={15} className="text-muted-foreground" /> : null}
    </div>
  ) : null;
  return (
    <section
      className={cn("rounded-2xl border border-border bg-glass-card shadow-[inset_0_1px_0_oklch(1_0_0/6%)]", className)}
    >
      {onOpen ? (
        <h2 className="m-0 text-[13px] font-semibold">
          <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-t-2xl text-left transition-colors duration-100 ease-out outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-foreground/10"
          >
            {header}
          </button>
        </h2>
      ) : (
        header
      )}
      {children ? <div className={cn("px-3 pb-3", title ? "pt-1" : "pt-3")}>{children}</div> : null}
    </section>
  );
}
