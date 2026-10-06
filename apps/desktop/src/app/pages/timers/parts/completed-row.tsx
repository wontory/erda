import { endClock } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { CheckCircle2 } from "lucide-react";

import { timerCommands } from "#/features/timers/commands.ts";
import type { CompletedTimer } from "#/features/timers/types.ts";
import { runAction } from "#/lib/action.ts";

export function CompletedRow({ item }: { item: CompletedTimer }) {
  const { id, name } = item.timer;
  const restart = () => void runAction(() => timerCommands.restart(id), "타이머를 다시 시작하지 못했어요");
  const dismiss = () => void runAction(() => timerCommands.dismissCompleted(id), "완료 항목을 닫지 못했어요");
  return (
    <Item size="row">
      <ItemMedia>
        <CheckCircle2 size={18} className="text-success" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{name}</ItemTitle>
        <ItemDescription>{`완료 ${endClock(item.finishedMs)}`}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button data-row-focus variant="outline" size="xs" aria-label={`${name} 재시작`} onClick={restart}>
          재시작
        </Button>
        <Button variant="ghost" size="xs" aria-label={`${name} 닫기`} onClick={dismiss}>
          닫기
        </Button>
      </ItemActions>
    </Item>
  );
}
