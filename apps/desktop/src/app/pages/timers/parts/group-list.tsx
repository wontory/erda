import { describeGroup, type TimerGroup } from "@erda/core";
import { Swap } from "@erda/ui/components/swap";
import { Button } from "@erda/ui/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { Layers, Play } from "lucide-react";

import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { ItemValue } from "#/app/pages/shared/item-value.tsx";
import { openSettingsAction } from "#/lib/tauri.ts";

function GroupRow({ group, onStart }: { group: TimerGroup; onStart: () => void }) {
  return (
    <Item size="row">
      <ItemMedia>
        <Layers size={16} className="text-muted-foreground" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{group.name}</ItemTitle>
        <ItemDescription>{describeGroup(group)}</ItemDescription>
      </ItemContent>
      <ItemValue>{`${group.entries.length}개`}</ItemValue>
      <ItemActions>
        <Button variant="ghost" size="icon" aria-label={`${group.name} 시작`} onClick={onStart}>
          <Play />
        </Button>
      </ItemActions>
    </Item>
  );
}

export function GroupList({
  groups,
  loaded,
  onStart,
}: {
  groups: TimerGroup[];
  loaded: boolean;
  onStart: (group: TimerGroup) => void;
}) {
  return (
    <div className="relative flex flex-col">
      <Swap id={!loaded ? "loading" : groups.length === 0 ? "empty" : "rows"}>
        {loaded && groups.length === 0 ? (
          <EmptyState icon={Layers} title="그룹 없음" description="설정 › 타이머에서 그룹을 만들어 주세요" />
        ) : null}
        {loaded && groups.map((g) => <GroupRow key={g.id} group={g} onStart={() => onStart(g)} />)}
      </Swap>
      <Button variant="ghost" className="self-start" onClick={() => void openSettingsAction("timer")}>
        그룹 편집…
      </Button>
    </div>
  );
}
