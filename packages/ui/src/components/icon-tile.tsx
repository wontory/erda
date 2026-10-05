import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type IconTileProps = {
  icon: LucideIcon;
  color: string;
  size?: number;
  className?: string;
};

export function IconTile({ icon: Icon, color, size = 22, className }: IconTileProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center text-white", color, className)}
      style={{ width: size, height: size, borderRadius: size * 0.27 }}
    >
      <Icon size={size * 0.55} strokeWidth={2.25} />
    </span>
  );
}
