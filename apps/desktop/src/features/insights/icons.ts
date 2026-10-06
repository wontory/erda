import type { HistoryKind } from "@erda/core";
import { Award, Box, Sparkles, Stamp, Star, type LucideIcon } from "lucide-react";

const HISTORY_ICONS: Record<HistoryKind, LucideIcon> = { starforce: Star, potential: Sparkles, cube: Box, soul: Stamp };

export const historyIcon = (kind: HistoryKind): LucideIcon => HISTORY_ICONS[kind];
export const INSIGHT_ICONS = { achievements: Award } as const;
