import { MotionProvider } from "@erda/ui/components/motion-provider";
import { cn } from "@erda/ui/lib/utils";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { HUD_MOTION_MS, hudCardKey, useHudRows } from "#/features/hud/rows.ts";

import { HudRowView } from "./hud-row-view.tsx";

const HIDDEN = { opacity: 0, y: -6, scale: 0.98 };
const row = {
  initial: HIDDEN,
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: HUD_MOTION_MS / 1000, ease: "easeOut" } },
  exit: { ...HIDDEN, transition: { duration: HUD_MOTION_MS / 1000, ease: "easeIn" } },
} as const;

export function HudApp() {
  const { rows, leaving } = useHudRows();
  const [wasLeaving, setWasLeaving] = useState(false);
  const [reentering, setReentering] = useState(false);
  if (wasLeaving !== leaving) {
    setWasLeaving(leaving);
    setReentering(!leaving && rows.length > 0);
  }
  if (rows.length === 0) return null;
  return (
    <MotionProvider>
      <div className={cn("relative flex flex-col gap-3 p-3", leaving ? "hud-leave" : reentering && "hud-enter")}>
        <AnimatePresence mode="popLayout">
          {rows.map((r) => (
            <m.div key={hudCardKey(r)} layout="position" {...row}>
              <HudRowView row={r} />
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </MotionProvider>
  );
}
