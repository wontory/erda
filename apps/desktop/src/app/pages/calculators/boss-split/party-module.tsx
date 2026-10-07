import { MAX_RATIO, PARTY_SIZES, splitRoleLabel } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@erda/ui/components/ui/number-field";
import { Switch } from "@erda/ui/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { Users } from "lucide-react";
import { useId } from "react";

function RatioInputs({ ratios, onChange }: { ratios: number[]; onChange: (index: number, value: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ratios.map((r, i) => {
        const label = splitRoleLabel(i, ratios.length);
        return (
          <NumberField
            key={label}
            value={r}
            min={0}
            max={MAX_RATIO}
            step={1}
            onValueChange={(v) => onChange(i, v ?? 0)}
            className="flex-col items-stretch gap-1"
          >
            <span className="px-0.5 text-[11px] text-muted-foreground">{label}</span>
            <NumberFieldGroup>
              <NumberFieldInput aria-label={`${label} 비율`} placeholder="0" />
            </NumberFieldGroup>
          </NumberField>
        );
      })}
    </div>
  );
}

export function PartyModule({
  count,
  byRatio,
  ratios,
  onCount,
  onByRatio,
  onRatio,
}: {
  count: number;
  byRatio: boolean;
  ratios: number[];
  onCount: (count: number) => void;
  onByRatio: (on: boolean) => void;
  onRatio: (index: number, value: number) => void;
}) {
  const switchId = useId();
  return (
    <Module title="파티" icon={Users}>
      <div className="flex flex-col gap-2.5">
        <Tabs value={String(count)} onValueChange={(v) => onCount(Number(v))}>
          <TabsList className="w-full" aria-label="파티 인원">
            {PARTY_SIZES.map((n) => (
              <TabsTrigger key={n} value={String(n)} className="tabular-nums">
                {n}인
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label htmlFor={switchId} className="flex items-center justify-between gap-2 px-0.5 text-[12px]">
          <span>비율로 나누기</span>
          <Switch id={switchId} checked={byRatio} onCheckedChange={(on) => onByRatio(on)} />
        </label>
        {byRatio ? (
          <>
            <RatioInputs ratios={ratios} onChange={onRatio} />
            <div className="px-0.5 text-[11px] text-muted-foreground">실수령 기준 비율이에요. 예: 6 : 4, 70 : 30</div>
          </>
        ) : null}
      </div>
    </Module>
  );
}
