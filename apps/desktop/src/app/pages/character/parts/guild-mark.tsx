import { IconTile } from "@erda/ui/components/icon-tile";
import { Flag } from "lucide-react";

import { useGuildMark } from "#/features/character/use-guild-mark.ts";

export function GuildMark({ world, name, size }: { world: string; name: string; size: number }) {
  const src = useGuildMark(world, name);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 object-contain [image-rendering:pixelated]"
      />
    );
  }
  if (size < 24) return <Flag size={size} className="shrink-0 text-teal-500" aria-hidden />;
  return <IconTile icon={Flag} color="bg-teal-500" size={size} />;
}
