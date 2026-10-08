import { describeError } from "@erda/api/errors";
import { clampLevel, maxStar, type StarforceCandidate, type StarforceItem } from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Button } from "@erda/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@erda/ui/components/ui/dialog";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@erda/ui/components/ui/number-field";
import { ScrollArea } from "@erda/ui/components/ui/scroll-area";
import { cn } from "@erda/ui/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";

import { StarCount } from "./star-count.tsx";
import { useEquippedCandidates } from "./use-equipped-candidates.ts";

const LEVEL_PRESETS = [140, 150, 160, 200, 250];

function EquippedList({
  selected,
  onPick,
}: {
  selected: StarforceItem | null;
  onPick: (candidate: StarforceCandidate) => void;
}) {
  const { owner, candidates, isPending, error } = useEquippedCandidates();
  let body;
  if (!owner)
    body = <p className="px-2 py-1 text-muted-foreground">설정 › 캐릭터에서 본캐를 정하면 장비를 고를 수 있어요.</p>;
  else if (isPending) body = <LoadingRow label="장비 불러오는 중…" />;
  else if (error) body = <p className="px-2 py-1 text-destructive">{describeError(error)}</p>;
  else if (candidates.length === 0)
    body = <p className="px-2 py-1 text-muted-foreground">강화할 수 있는 장비가 없어요.</p>;
  else
    body = (
      <ScrollArea viewportClassName="max-h-56">
        <ul className="flex flex-col gap-0.5">
          {candidates.map((c) => {
            const active = selected?.name === c.item.name && selected.part === c.item.part;
            return (
              <li key={`${c.slot}-${c.item.name}`}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPick(c)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-100 hover:bg-glass-card-hover",
                    active && "bg-primary/10 hover:bg-primary/15",
                  )}
                >
                  <GameIcon src={c.item.icon} size={28} alt="" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">{c.item.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {c.slot} · Lv.{c.level} · <StarCount>{c.star}</StarCount>
                    </span>
                  </span>
                  {active ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    );
  return (
    <div className="flex flex-col gap-1.5">
      <span>{owner ? `${owner}의 장비` : "내 장비"}</span>
      <div className="rounded-lg border bg-foreground/3 p-1">{body}</div>
    </div>
  );
}

export function ItemDialog({
  open,
  item,
  level,
  startStar,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  item: StarforceItem | null;
  level: number;
  startStar: number;
  onOpenChange: (open: boolean) => void;
  onApply: (item: StarforceItem | null, level: number, startStar: number) => void;
}) {
  const [draftItem, setDraftItem] = useState(item);
  const [draftLevel, setDraftLevel] = useState(level);
  const [draftStar, setDraftStar] = useState(startStar);
  const cap = maxStar(clampLevel(draftLevel));
  // Typing a different level means it's no longer that item.
  const setLevel = (next: number) => {
    setDraftLevel(next);
    setDraftItem(null);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>장비 설정</DialogTitle>
          <DialogDescription>바꾸면 강화 기록이 초기화돼요.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-[12px]">
          <EquippedList
            selected={draftItem}
            onPick={(c) => {
              setDraftItem(c.item);
              setDraftLevel(c.level);
              setDraftStar(c.star);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <span>착용 레벨{draftItem ? "" : " (직접 입력)"}</span>
            <div className="grid grid-cols-5 gap-1">
              {LEVEL_PRESETS.map((l) => (
                <Button
                  key={l}
                  size="xs"
                  variant={!draftItem && draftLevel === l ? "default" : "outline"}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </Button>
              ))}
            </div>
            <NumberField
              value={draftLevel}
              min={1}
              max={250}
              step={1}
              onValueChange={(v) => {
                if ((v ?? 1) !== draftLevel) setLevel(v ?? 1);
              }}
            >
              <NumberFieldGroup className="w-full">
                <NumberFieldInput aria-label="착용 레벨" className="text-right" />
              </NumberFieldGroup>
            </NumberField>
          </div>
          <div className="flex flex-col gap-1.5">
            <span>시작 성 (최대 {cap}성)</span>
            <NumberField
              value={Math.min(draftStar, cap)}
              min={0}
              max={cap}
              step={1}
              onValueChange={(v) => setDraftStar(v ?? 0)}
            >
              <NumberFieldGroup className="w-full">
                <NumberFieldInput aria-label="시작 성" className="text-right" />
              </NumberFieldGroup>
            </NumberField>
          </div>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => {
              const l = clampLevel(draftLevel);
              onApply(draftItem, l, Math.min(Math.max(0, draftStar), maxStar(l)));
              onOpenChange(false);
            }}
          >
            적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
