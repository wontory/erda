import type { SimulatorId } from "@erda/core";
import { Sparkles, type LucideIcon } from "lucide-react";

const SIMULATOR_ICONS: Record<SimulatorId, LucideIcon> = { starforce: Sparkles };

export const simulatorIcon = (id: SimulatorId): LucideIcon => SIMULATOR_ICONS[id];
