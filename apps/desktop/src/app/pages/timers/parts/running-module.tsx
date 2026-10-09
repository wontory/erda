import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@erda/ui/components/ui/dialog";
import { listItem } from "@erda/ui/lib/motion";
import { Timer } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState, type ComponentProps } from "react";

import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { timerCommands } from "#/features/timers/commands.ts";
import { useTimers } from "#/features/timers/use-timers.ts";
import { useAction } from "#/lib/action.ts";

import { RunningRow } from "./running-row.tsx";
import { moduleHeading, useFocusRescue } from "./use-focus-rescue.ts";

function CancelAllDialog({
  open,
  onOpenChange,
  count,
  pending,
  onConfirm,
  finalFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  pending: boolean;
  onConfirm: () => void;
  finalFocus: ComponentProps<typeof DialogContent>["finalFocus"];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>{`타이머 ${count}개 취소`}</DialogTitle>
          <DialogDescription>실행 중인 타이머를 모두 멈춰요. 되돌릴 수 없어요.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>닫기</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            모두 취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RunningModule() {
  const { active, loaded, error, retry, remainingOf } = useTimers();
  const { listRef, listProps, rescue } = useFocusRescue();
  const [confirming, setConfirming] = useState(false);
  const [count, setCount] = useState(0);
  const cancelAll = useAction();
  const n = active.length;
  const askCancelAll = () => {
    setCount(n);
    setConfirming(true);
  };
  const confirm = async () => {
    await cancelAll.run(() => timerCommands.cancelAll(), "타이머를 취소하지 못했어요");
    setConfirming(false);
  };
  return (
    <Module
      title={`실행 중 ${n}`}
      icon={Timer}
      titleClassName={n > 0 ? "text-primary" : undefined}
      trailing={
        n > 0 ? (
          <Button variant="ghost" onClick={askCancelAll}>
            모두 취소
          </Button>
        ) : undefined
      }
    >
      <div {...listProps}>
        {error ? (
          <ErrorRow message={error} onRetry={retry} />
        ) : loaded ? (
          <AnimatePresence initial={false} onExitComplete={rescue}>
            {n === 0 ? (
              <m.div key="empty" {...listItem}>
                <EmptyState
                  icon={Timer}
                  title="실행 중인 타이머 없음"
                  description="아래 프리셋을 누르면 바로 시작돼요"
                />
              </m.div>
            ) : (
              active.map((t) => (
                <m.div key={t.id} data-row {...listItem}>
                  <RunningRow timer={t} remaining={remainingOf(t)} />
                </m.div>
              ))
            )}
          </AnimatePresence>
        ) : (
          <LoadingRow minHeight={130} />
        )}
      </div>
      <CancelAllDialog
        open={confirming}
        onOpenChange={setConfirming}
        count={count}
        pending={cancelAll.pending}
        onConfirm={() => void confirm()}
        finalFocus={() => moduleHeading(listRef.current) ?? true}
      />
    </Module>
  );
}
