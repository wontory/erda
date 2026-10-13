import { worldIconUrl } from "@erda/core";
import { Globe } from "lucide-react";

import { GameIcon } from "#/components/game-icon.tsx";
import { imageA11y } from "#/lib/a11y.ts";

const ICON_PX = 14;

export function WorldIcon({ world, size = 14, alt = world }: { world: string; size?: number; alt?: string }) {
  const url = worldIconUrl(world);
  if (url) return <GameIcon src={url} size={ICON_PX} alt={alt} className="rounded-sm" native />;
  return <Globe size={size} className="text-muted-foreground" {...imageA11y(alt)} />;
}
