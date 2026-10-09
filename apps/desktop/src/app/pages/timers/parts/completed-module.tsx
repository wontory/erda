import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import { listItem } from "@erda/ui/lib/motion";
import { focusScreenTitle } from "@erda/ui/lib/screen-title";
import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { timerCommands } from "#/features/timers/commands.ts";
import { useTimers } from "#/features/timers/use-timers.ts";
import { useAction } from "#/lib/action.ts";

import { CompletedRow } from "./completed-row.tsx";
import { useFocusRescue } from "./use-focus-rescue.ts";

export function CompletedModule() {
  const { completed } = useTimers();
  const { listRef, listProps, rescue } = useFocusRescue();
  const dismissAll = useAction();
  const onDismissAll = async () => {
    const hadFocus = listRef.current?.closest("section")?.contains(document.activeElement) ?? false;
    await dismissAll.run(() => timerCommands.dismissAllCompleted(), "완료 항목을 닫지 못했어요");
    if (hadFocus) focusScreenTitle();
  };
  return (
    <AnimatePresence initial={false}>
      {completed.length > 0 ? (
        <m.div key="completed" {...listItem} className="-mt-2.5 overflow-hidden">
          <div className="pt-2.5">
            <Module
              title="완료"
              icon={CheckCircle2}
              trailing={
                <Button variant="ghost" disabled={dismissAll.pending} onClick={() => void onDismissAll()}>
                  모두 닫기
                </Button>
              }
            >
              <div {...listProps}>
                <AnimatePresence initial={false} onExitComplete={rescue}>
                  {completed.map((c) => (
                    <m.div key={c.timer.id} data-row {...listItem} className="overflow-hidden">
                      <CompletedRow item={c} />
                    </m.div>
                  ))}
                </AnimatePresence>
              </div>
            </Module>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
