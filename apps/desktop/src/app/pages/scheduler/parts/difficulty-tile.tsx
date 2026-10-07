import { difficultyColor } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { cn } from "@erda/ui/lib/utils";
import { Crown } from "lucide-react";

export function DifficultyTile({ difficulty, size = 22 }: { difficulty: string; size?: number }) {
  const color = difficultyColor(difficulty);
  return (
    <IconTile
      icon={Crown}
      color={color}
      size={size}
      className={cn(color === "bg-neutral-900" && "ring-1 ring-white/25")}
    />
  );
}
