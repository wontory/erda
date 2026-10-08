import type { CalculatorId } from "@erda/core";
import { HandCoins, Sparkles, type LucideIcon } from "lucide-react";

const CALCULATOR_ICONS: Record<CalculatorId, LucideIcon> = { "boss-split": HandCoins, starforce: Sparkles };

export const calculatorIcon = (id: CalculatorId): LucideIcon => CALCULATOR_ICONS[id];
