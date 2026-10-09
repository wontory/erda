import { PROTECTABLE_STARS } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@erda/ui/components/ui/number-field";
import { Switch } from "@erda/ui/components/ui/switch";
import { useId, useState } from "react";

import { SheetBody, SheetFooter, SheetHeader, SheetLayout, SheetTitle } from "#/sheet/sheet-layout.tsx";

import { StarCount } from "./star-count.tsx";

function ProtectRow({ star, checked, onChange }: { star: number; checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex h-8 items-center justify-between gap-2 rounded-lg bg-foreground/4 px-2.5 text-[13px]"
    >
      <StarCount>{star}</StarCount>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={(on) => onChange(on)} />
    </label>
  );
}

export function AutoSheet({
  star,
  cap,
  target,
  protectStars,
  onClose,
  onStart,
}: {
  star: number;
  cap: number;
  target: number;
  protectStars: number[];
  onClose: () => void;
  onStart: (target: number, protectStars: number[]) => void;
}) {
  const [draftTarget, setDraftTarget] = useState(target);
  const [draftProtect, setDraftProtect] = useState(protectStars);
  const clamped = Math.min(Math.max(draftTarget, star + 1), cap);
  const toggle = (s: number, on: boolean) =>
    setDraftProtect((list) => (on ? [...list.filter((x) => x !== s), s] : list.filter((x) => x !== s)));
  return (
    <SheetLayout>
      <SheetHeader>
        <SheetTitle>자동 강화</SheetTitle>
      </SheetHeader>
      <SheetBody>
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
      </SheetBody>
      <SheetFooter>
        <Button
          onClick={() => {
            onStart(clamped, draftProtect);
            onClose();
          }}
        >
          시작
        </Button>
      </SheetFooter>
    </SheetLayout>
  );
}
