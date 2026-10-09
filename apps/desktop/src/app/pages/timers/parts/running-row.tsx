import { endClock, formatRemaining } from "@erda/core";
import { RingGauge } from "@erda/ui/components/ring-gauge";
import { TimerIcon } from "@erda/ui/components/timer-icon";
import { Button } from "@erda/ui/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { Toggle } from "@erda/ui/components/ui/toggle";
import { timerTint } from "@erda/ui/lib/timer-tint";
import { cn } from "@erda/ui/lib/utils";
import { Repeat, X } from "lucide-react";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";
import { timerCommands } from "#/features/timers/commands.ts";
import type { ActiveTimer } from "#/features/timers/types.ts";
import { runAction } from "#/lib/action.ts";

export function RunningRow({ timer, remaining }: { timer: ActiveTimer; remaining: number }) {
  const setRepeat = (on: boolean) =>
    void runAction(() => timerCommands.setRepeat(timer.id, on), "반복을 바꾸지 못했어요");
  const cancel = () => void runAction(() => timerCommands.cancel(timer.id), "타이머를 취소하지 못했어요");
  return (
    <Item size="row">
      <ItemMedia>
        <RingGauge value={remaining} max={timer.seconds} tint={timerTint(timer.color)} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>
          <span className="inline-flex items-center gap-1.5">
            <TimerIcon name={timer.icon} color={timer.color} size={14} />
            {timer.name}
          </span>
        </ItemTitle>
        <ItemDescription>{`종료 ${endClock(timer.endMs)}${timer.repeats ? " · 반복" : ""}`}</ItemDescription>
      </ItemContent>
      <ItemValue className={cn(remaining < 60 && "text-danger")}>{formatRemaining(remaining)}</ItemValue>
      <ItemActions>
        <Toggle pressed={timer.repeats} onPressedChange={setRepeat} aria-label={`${timer.name} 반복`} title="반복">
          <Repeat />
        </Toggle>
        <Button
          data-row-focus
          variant="ghost"
          size="icon"
          aria-label={`${timer.name} 취소`}
          title="취소"
          onClick={cancel}
        >
          <X />
        </Button>
      </ItemActions>
    </Item>
  );
}
