import { clampLevel, maxStar } from "@erda/core";
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
import { useState } from "react";

const LEVEL_PRESETS = [140, 150, 160, 200, 250];

export function ItemDialog({
  open,
  level,
  startStar,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  level: number;
  startStar: number;
  onOpenChange: (open: boolean) => void;
  onApply: (level: number, startStar: number) => void;
}) {
  const [draftLevel, setDraftLevel] = useState(level);
  const [draftStar, setDraftStar] = useState(startStar);
  const cap = maxStar(clampLevel(draftLevel));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>장비 설정</DialogTitle>
          <DialogDescription>바꾸면 강화 기록이 초기화돼요.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-[12px]">
          <div className="flex flex-col gap-1.5">
            <span>착용 레벨</span>
            <div className="grid grid-cols-5 gap-1">
              {LEVEL_PRESETS.map((l) => (
                <Button
                  key={l}
                  size="xs"
                  variant={draftLevel === l ? "default" : "outline"}
                  onClick={() => setDraftLevel(l)}
                >
                  {l}
                </Button>
              ))}
            </div>
            <NumberField value={draftLevel} min={1} max={250} step={1} onValueChange={(v) => setDraftLevel(v ?? 1)}>
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
              onApply(l, Math.min(Math.max(0, draftStar), maxStar(l)));
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
