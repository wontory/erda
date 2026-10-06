import type { NewsCategory } from "@erda/core";
import { ArrowDown, Gift, Megaphone, ShoppingBag, Wrench, type LucideIcon } from "lucide-react";

const ICONS: Record<NewsCategory, LucideIcon> = {
  notice: Megaphone,
  update: ArrowDown,
  event: Gift,
  cashshop: ShoppingBag,
};

export const newsIcon = (category: NewsCategory): LucideIcon => ICONS[category];
export const MaintenanceIcon = Wrench;
