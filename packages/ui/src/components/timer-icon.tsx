import { cn } from "cn";
import {
  Coins,
  DoorOpen,
  Droplets,
  Flame,
  FlaskConical,
  Hammer,
  Mountain,
  Orbit,
  Radio,
  Snowflake,
  Sparkles,
  Sun,
  Sword,
  Ticket,
  Timer,
  Tornado,
  type LucideIcon,
} from "lucide-react";

import { timerTint } from "#/lib/timer-tint.ts";

const ICONS: Record<string, LucideIcon> = {
  Sun,
  Droplets,
  Radio,
  Sword,
  Mountain,
  DoorOpen,
  Orbit,
  Flame,
  Snowflake,
  Tornado,
  Hammer,
  Sparkles,
  Ticket,
  Coins,
  FlaskConical,
  Timer,
};

export function TimerIcon({
  name,
  color,
  size = 18,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Timer;
  return <Icon size={size} className={cn(timerTint(color), className)} />;
}
