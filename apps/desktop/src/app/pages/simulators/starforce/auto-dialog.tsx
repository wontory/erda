import { PROTECTABLE_STARS } from "@erda/core";
import { Dialog, DialogContent, DialogTitle } from "@erda/ui/components/ui/dialog";
import { useState } from "react";

import { SfBox, SfButton, SfSwitchRow } from "./sf-parts.tsx";
import { SF_PILL, SF_THEME } from "./theme.ts";

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
      <DialogContent style={SF_THEME} className="gap-2 sm:max-w-xs">
        <DialogTitle>자동 강화</DialogTitle>
        <SfBox>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-[12px]">
            <span className="text-(--sf-muted)">현재 단계</span>
            <span className={`${SF_PILL} font-bold tabular-nums`}>★ {star}</span>
            <span className="text-(--sf-muted)">목표 단계</span>
            <div className="flex items-center gap-1">
              <span className="flex-1 rounded-md border border-(--sf-box-edge) bg-(--sf-box) px-2 py-0.5 text-right font-bold tabular-nums">
                {clamped}
              </span>
              <SfButton
                aria-label="목표 올리기"
                className="size-6 text-[10px]"
                onClick={() => setDraftTarget(Math.min(clamped + 1, cap))}
              >
                ▲
              </SfButton>
              <SfButton
                aria-label="목표 내리기"
                className="size-6 text-[10px]"
                onClick={() => setDraftTarget(Math.max(clamped - 1, star + 1))}
              >
                ▼
              </SfButton>
              <SfButton className="h-6 px-1.5 text-[10px]" onClick={() => setDraftTarget(cap)}>
                MAX
              </SfButton>
            </div>
          </div>
        </SfBox>
        <SfBox title="파괴 방지 설정">
          <div className="grid grid-cols-3 gap-2">
            {PROTECTABLE_STARS.map((s) => (
              <div key={s} className={`${SF_PILL} px-2`}>
                <SfSwitchRow label={`★${s}`} checked={draftProtect.includes(s)} onChange={(on) => toggle(s, on)} />
              </div>
            ))}
          </div>
        </SfBox>
        <SfButton
          className="mx-auto h-8 w-28 text-[13px]"
          onClick={() => {
            onStart(clamped, draftProtect);
            onOpenChange(false);
          }}
        >
          자동 강화
        </SfButton>
      </DialogContent>
    </Dialog>
  );
}
