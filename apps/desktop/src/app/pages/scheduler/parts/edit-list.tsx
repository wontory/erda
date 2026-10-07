import { KoreanNumber, PRICE_BASE_DATE, partyOf, priceOf, type BossEntry, type BossState } from "@erda/core";
import { CheckCircle } from "@erda/ui/components/check-circle";
import { Module } from "@erda/ui/components/module";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@erda/ui/components/ui/number-field";
import { Pencil } from "lucide-react";

import { DifficultyTile } from "./difficulty-tile.tsx";

type EditHandlers = {
  onToggleSelected?: (id: string) => void;
  onParty: (id: string, n: number) => void;
  onPrice: (id: string, n: number) => void;
};

const committed = (fn: (n: number) => void) => (v: number | null) => {
  if (v !== null) fn(v);
};

function EditRow({
  entry,
  state,
  onToggleSelected,
  onParty,
  onPrice,
}: EditHandlers & { entry: BossEntry; state: BossState }) {
  const selected = onToggleSelected ? state.selectedIDs.includes(entry.id) : true;
  const label = `${entry.name} ${entry.difficulty}`;
  return (
    <div className="rounded-lg px-2 py-1.5 hover:bg-glass-card-hover">
      <div className="flex items-center gap-2">
        {onToggleSelected ? (
          <CheckCircle checked={selected} label={`${label} 선택`} onChange={() => onToggleSelected(entry.id)} />
        ) : null}
        <DifficultyTile difficulty={entry.difficulty} size={20} />
        <span className="min-w-0 flex-1 truncate">
          {entry.name} <span className="text-[11px] text-muted-foreground">{entry.difficulty}</span>
        </span>
      </div>
      {selected ? (
        <>
          <div className="mt-1.5 flex items-center justify-end gap-2 text-[12px]">
            <NumberField
              value={partyOf(state, entry.id)}
              min={1}
              max={6}
              onValueCommitted={committed((n) => onParty(entry.id, n))}
            >
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput aria-label={`${label} 파티`} className="w-8" />
                <NumberFieldIncrement />
              </NumberFieldGroup>
              <span className="text-muted-foreground">인</span>
            </NumberField>
            <NumberField
              value={priceOf(state, entry)}
              min={0}
              max={99_999_999_999}
              onValueCommitted={committed((n) => onPrice(entry.id, n))}
            >
              <NumberFieldGroup>
                <NumberFieldInput aria-label={`${label} 가격`} className="w-28 text-right" />
              </NumberFieldGroup>
            </NumberField>
          </div>
          <div className="mt-0.5 text-right text-[11px] text-muted-foreground tabular-nums">
            {KoreanNumber.format(priceOf(state, entry))} 메소
          </div>
        </>
      ) : null}
    </div>
  );
}

export function EditList({
  entries,
  state,
  emptyMessage,
  ...handlers
}: EditHandlers & { entries: BossEntry[]; state: BossState; emptyMessage?: string }) {
  return (
    <Module title="편집" icon={Pencil}>
      <div className="flex flex-col gap-1">
        {entries.length === 0 && emptyMessage ? (
          <div className="px-2 py-2 text-[12px] text-muted-foreground">{emptyMessage}</div>
        ) : (
          entries.map((e) => <EditRow key={e.id} entry={e} state={state} {...handlers} />)
        )}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        가격 기준 {PRICE_BASE_DATE} · 파티·가격은 인게임 연동에도 적용돼요
      </div>
    </Module>
  );
}
