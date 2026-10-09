import {
  POTENTIAL_GRADES,
  POTENTIAL_GRADE_LABELS,
  POTENTIAL_KINDS,
  POTENTIAL_KIND_LABELS,
  POTENTIAL_MAX_LEVEL,
  POTENTIAL_PARTS,
  SOUL_STEPS,
  WEAPON_PART,
  clampPotentialLevel,
  type PotentialCandidate,
  type PotentialGrade,
  type PotentialItem,
  type PotentialKind,
  type PotentialStart,
} from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Button } from "@erda/ui/components/ui/button";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@erda/ui/components/ui/number-field";
import { ScrollArea } from "@erda/ui/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@erda/ui/components/ui/select";
import { cn } from "@erda/ui/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";

import type { EquippedView } from "#/features/sheet/protocol.ts";
import {
  SheetBody,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetLayout,
  SheetTitle,
} from "#/sheet/sheet-layout.tsx";

import { GradeLabel } from "./roll-card.tsx";

export type StartDraft = Record<PotentialKind, PotentialStart>;

export interface ItemDraft {
  item: PotentialItem | null;
  part: number;
  level: number;
  soulStep: number;
  start: StartDraft;
}

const LEVEL_PRESETS = [140, 150, 160, 200, 250];
const GRADE_ITEMS = POTENTIAL_GRADES.map((g) => ({ value: g, label: POTENTIAL_GRADE_LABELS[g] }));
const PART_ITEMS = POTENTIAL_PARTS.map((label, i) => ({ value: String(i + 1), label }));

const blankStart = (start: StartDraft): StartDraft => ({
  main: { grade: start.main.grade, texts: [] },
  additional: { grade: start.additional.grade, texts: [] },
  soul: { grade: start.soul.grade, texts: [] },
});

function EquippedList({
  equipped,
  selected,
  onPick,
}: {
  equipped: EquippedView<PotentialCandidate>;
  selected: PotentialItem | null;
  onPick: (candidate: PotentialCandidate) => void;
}) {
  const { owner, candidates, isPending, error } = equipped;
  let body;
  if (!owner)
    body = <p className="px-2 py-1 text-muted-foreground">설정 › 캐릭터에서 본캐를 정하면 장비를 고를 수 있어요.</p>;
  else if (isPending) body = <LoadingRow label="장비 불러오는 중…" />;
  else if (error) body = <p className="px-2 py-1 text-destructive">{error}</p>;
  else if (candidates.length === 0)
    body = <p className="px-2 py-1 text-muted-foreground">잠재능력을 바꿀 수 있는 장비가 없어요.</p>;
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
                    <span className="flex gap-1 text-[11px] text-muted-foreground">
                      {c.slot} · Lv.{c.level}
                      {c.start.main ? (
                        <>
                          {" · "}
                          <GradeLabel grade={c.start.main.grade} className="text-[11px]" />
                        </>
                      ) : null}
                      {c.start.additional ? (
                        <>
                          {" / "}
                          <GradeLabel grade={c.start.additional.grade} className="text-[11px]" />
                        </>
                      ) : null}
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

function GradeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PotentialGrade;
  onChange: (grade: PotentialGrade) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <Select
        items={GRADE_ITEMS}
        value={value}
        onValueChange={(v) => {
          const g = POTENTIAL_GRADES.find((o) => o === v);
          if (g) onChange(g);
        }}
      >
        <SelectTrigger className="w-full" aria-label={`${label} 시작 등급`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRADE_ITEMS.map((g) => (
            <SelectItem key={g.value} value={g.value}>
              {g.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ItemSheet({
  initial,
  equipped,
  onClose,
  onApply,
}: {
  initial: ItemDraft;
  equipped: EquippedView<PotentialCandidate>;
  onClose: () => void;
  onApply: (draft: ItemDraft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const manual = (p: Partial<ItemDraft>) =>
    setDraft((d) => ({ ...d, ...p, item: null, start: blankStart(p.start ?? d.start) }));
  const weapon = draft.part === WEAPON_PART;
  const kinds = POTENTIAL_KINDS.filter((k) => k !== "soul" || weapon);
  return (
    <SheetLayout>
      <SheetHeader>
        <SheetTitle>장비 설정</SheetTitle>
        <SheetDescription>바꾸면 재설정 기록이 초기화돼요.</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <div className="flex flex-col gap-3 text-[12px]">
          <EquippedList
            equipped={equipped}
            selected={draft.item}
            onPick={(c) =>
              setDraft({
                item: c.item,
                part: c.part,
                level: c.level,
                soulStep: c.soulStep,
                start: {
                  main: c.start.main ?? { grade: "rare", texts: [] },
                  additional: c.start.additional ?? { grade: "rare", texts: [] },
                  soul: c.start.soul ?? { grade: "rare", texts: [] },
                },
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <span>부위{draft.item ? "" : " (직접 입력)"}</span>
              <Select
                items={PART_ITEMS}
                value={String(draft.part)}
                onValueChange={(v) => {
                  if (v) manual({ part: Number(v) });
                }}
              >
                <SelectTrigger className="w-full" aria-label="부위">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PART_ITEMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span>착용 레벨</span>
              <NumberField
                value={draft.level}
                min={0}
                max={POTENTIAL_MAX_LEVEL}
                step={1}
                onValueChange={(v) => {
                  if ((v ?? 0) !== draft.level) manual({ level: v ?? 0 });
                }}
              >
                <NumberFieldGroup className="w-full">
                  <NumberFieldInput aria-label="착용 레벨" className="text-right" />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {LEVEL_PRESETS.map((l) => (
              <Button
                key={l}
                variant={!draft.item && draft.level === l ? "default" : "outline"}
                onClick={() => manual({ level: l })}
              >
                {l}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span>시작 등급{draft.item ? " (장착 중인 잠재능력에서 시작)" : " (옵션은 무작위)"}</span>
            <div className={cn("grid gap-2", weapon ? "grid-cols-3" : "grid-cols-2")}>
              {kinds.map((k) => (
                <GradeSelect
                  key={k}
                  label={POTENTIAL_KIND_LABELS[k]}
                  value={draft.start[k].grade}
                  onChange={(grade) => setDraft((d) => ({ ...d, start: { ...d.start, [k]: { grade, texts: [] } } }))}
                />
              ))}
            </div>
          </div>
          {weapon ? (
            <div className="flex flex-col gap-1.5">
              <span>소울 증폭 단계</span>
              <div className="grid grid-cols-4 gap-1">
                {SOUL_STEPS.map((s) => (
                  <Button
                    key={s}
                    variant={draft.soulStep === s ? "default" : "outline"}
                    onClick={() => setDraft((d) => ({ ...d, soulStep: s }))}
                  >
                    {s}단계
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SheetBody>
      <SheetFooter>
        <Button
          onClick={() => {
            onApply({ ...draft, level: clampPotentialLevel(draft.level) });
            onClose();
          }}
        >
          적용
        </Button>
      </SheetFooter>
    </SheetLayout>
  );
}
