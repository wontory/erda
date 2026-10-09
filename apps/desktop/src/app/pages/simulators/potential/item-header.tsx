import { POTENTIAL_PARTS, WEAPON_PART, type PotentialGrade, type PotentialItem } from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { cn } from "@erda/ui/lib/utils";
import { ChevronRight, Gem } from "lucide-react";

import { SlotGradeUp } from "./grade-up-effect.tsx";
import { GradeLabel } from "./roll-card.tsx";
import { GRADE_BORDER } from "./styles.ts";

export function ItemHeader({
  item,
  part,
  level,
  soulStep,
  grade,
  burst,
  disabled,
  onEdit,
}: {
  item: PotentialItem | null;
  part: number;
  level: number;
  soulStep: number;
  grade: PotentialGrade | null;
  burst: number | null;
  disabled: boolean;
  onEdit: () => void;
}) {
  const partLabel = item ? item.part : POTENTIAL_PARTS[part - 1];
  const meta = [item ? partLabel : null, `Lv.${level}`, part === WEAPON_PART ? `증폭 ${soulStep}단계` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onEdit}
      aria-label="장비 설정"
      className="-m-1 flex items-center gap-3 rounded-[calc(var(--radius-2xl)-9px)] p-1 text-left transition-colors duration-100 ease-out outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-foreground/10 disabled:pointer-events-none"
    >
      <span
        className={cn(
          "relative grid size-20 shrink-0 place-items-center rounded-[calc(var(--radius-2xl)-13px)] border bg-foreground/4 transition-colors duration-300",
          grade ? GRADE_BORDER[grade] : "border-border",
        )}
      >
        {item?.icon ? (
          <GameIcon src={item.icon} size={52} alt="" />
        ) : (
          <Gem className="size-9 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        )}
        {burst !== null ? <SlotGradeUp key={burst} /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-semibold">{item ? item.name : partLabel}</span>
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {meta}
          {grade ? <GradeLabel grade={grade} /> : null}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
