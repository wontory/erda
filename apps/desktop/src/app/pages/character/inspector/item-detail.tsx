import type { CharacterItemEquipmentItemEquipmentItem as Item } from "@erda/api/generated/model";
import { gradeColorClass, optionBreakdown } from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { Star } from "lucide-react";
import { Fragment, type ReactNode } from "react";

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-2 border-t border-border pt-2">
      <div className="mb-1 text-[11px] font-semibold text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function OptionLines({ grade, lines }: { grade?: string | null; lines: Array<string | null | undefined> }) {
  return (
    <>
      {grade ? <div className={`text-[11px] font-semibold ${gradeColorClass(grade)}`}>{grade}</div> : null}
      {lines.filter(Boolean).map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </>
  );
}

function StatRows({ rows }: { rows: ReturnType<typeof optionBreakdown> }) {
  return (
    <Part title="스탯">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-2 tabular-nums">
          <span>{r.label}</span>
          <span>
            +{r.total}
            <span className="ml-1 text-[10px]">
              {r.base ? <span className="text-muted-foreground">{r.base}</span> : null}
              {r.add ? <span className="text-success"> +{r.add}</span> : null}
              {r.etc ? <span className="text-grade-epic"> +{r.etc}</span> : null}
              {r.star ? <span className="text-warning"> +{r.star}</span> : null}
            </span>
          </span>
        </div>
      ))}
    </Part>
  );
}

export function ItemDetail({ item }: { item: Item }) {
  const rows = optionBreakdown(item);
  const star =
    item.starforce && item.starforce !== "0" ? (
      <span className="inline-flex items-center gap-0.5">
        <Star className="size-3 fill-current" />
        {item.starforce}
      </span>
    ) : null;
  const scroll = item.scroll_upgrade && item.scroll_upgrade !== "0" ? `주문서 ${item.scroll_upgrade}회` : null;
  const meta = [item.item_equipment_slot ?? item.item_equipment_part, star, item.potential_option_grade, scroll].filter(
    Boolean,
  );
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <GameIcon src={item.item_icon} size={48} alt={item.item_name ?? ""} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{item.item_name}</div>
          <div className="text-[11px] text-muted-foreground">
            {meta.map((p, i) => (
              <Fragment key={i}>
                {i > 0 ? " · " : null}
                {p}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      {rows.length > 0 ? <StatRows rows={rows} /> : null}
      {item.potential_option_grade ? (
        <Part title="잠재능력">
          <OptionLines
            grade={item.potential_option_grade}
            lines={[item.potential_option_1, item.potential_option_2, item.potential_option_3]}
          />
        </Part>
      ) : null}
      {item.additional_potential_option_grade ? (
        <Part title="에디셔널">
          <OptionLines
            grade={item.additional_potential_option_grade}
            lines={[
              item.additional_potential_option_1,
              item.additional_potential_option_2,
              item.additional_potential_option_3,
            ]}
          />
        </Part>
      ) : null}
      {item.soul_name ? (
        <Part title="소울">
          <div>{item.soul_name}</div>
          <div className="text-muted-foreground">{item.soul_option}</div>
        </Part>
      ) : null}
    </div>
  );
}
