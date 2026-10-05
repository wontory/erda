import { worldIconUrl } from "@erda/core";
import { Globe } from "lucide-react";

import { GameIcon } from "#/components/game-icon.tsx";
import { imageA11y } from "#/lib/a11y.ts";

export function WorldIcon({ world, size = 14, alt = world }: { world: string; size?: number; alt?: string }) {
  const url = worldIconUrl(world);
  if (url) return <GameIcon src={url} size={size} alt={alt} className="rounded-sm" />;
  return <Globe size={size} className="text-muted-foreground" {...imageA11y(alt)} />;
}
