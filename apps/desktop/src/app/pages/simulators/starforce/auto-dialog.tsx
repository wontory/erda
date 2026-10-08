import { PROTECTABLE_STARS } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@erda/ui/components/ui/dialog";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@erda/ui/components/ui/number-field";
import { Switch } from "@erda/ui/components/ui/switch";
import { useId, useState } from "react";

import { StarCount } from "./star-count.tsx";

function ProtectRow({ star, checked, onChange }: { star: number; checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-2 rounded-lg bg-foreground/4 px-2.5 py-1.5">
      <StarCount>{star}</StarCount>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={(on) => onChange(on)} />
    </label>
  );
}

export function AutoDialog({
  open,
  star,
  cap,
  target,
  protectStars,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  star: number;
  cap: number;
  target: number;
  protectStars: number[];
  onOpenChange: (open: boolean) => void;
  onStart: (target: number, protectStars: number[]) => void;
}) {
  const [draftTarget, setDraftTarget] = useState(target);
  const [draftProtect, setDraftProtect] = useState(protectStars);
  const clamped = Math.min(Math.max(draftTarget, star + 1), cap);
  const toggle = (s: number, on: boolean) =>
    setDraftProtect((list) => (on ? [...list.filter((x) => x !== s), s] : list.filter((x) => x !== s)));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>자동 강화</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-[12px]">
          <div className="flex flex-col gap-1.5">
            <span>
              목표 단계{" "}
              <span className="text-muted-foreground">
                (현재 <StarCount>{star}</StarCount>)
              </span>
            </span>
            <div className="flex gap-1.5">
              <NumberField
                className="flex-1"
                value={clamped}
                min={star + 1}
                max={cap}
                step={1}
                onValueChange={(v) => setDraftTarget(v ?? star + 1)}
              >
                <NumberFieldGroup className="w-full">
                  <NumberFieldInput aria-label="목표 단계" className="text-right" />
                </NumberFieldGroup>
              </NumberField>
              <Button variant="outline" onClick={() => setDraftTarget(cap)}>
                최대
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span>파괴 방지</span>
            <div className="grid grid-cols-3 gap-1.5">
              {PROTECTABLE_STARS.map((s) => (
                <ProtectRow key={s} star={s} checked={draftProtect.includes(s)} onChange={(on) => toggle(s, on)} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => {
              onStart(clamped, draftProtect);
              onOpenChange(false);
            }}
          >
            시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
