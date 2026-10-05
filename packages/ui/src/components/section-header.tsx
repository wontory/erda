import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconTile } from "#/components/icon-tile.tsx";

export function SectionHeader({
  title,
  color,
  icon,
  trailing,
}: {
  title: string;
  color: string;
  icon: LucideIcon;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex h-8 items-center gap-2 px-1 text-[13px] font-semibold">
      <IconTile icon={icon} color={color} size={18} />
      <h2 className="m-0 flex-1 truncate text-[13px] font-semibold">{title}</h2>
      {trailing}
    </div>
  );
}
