import { KoreanNumber, MAX_MESO } from "@erda/core";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@erda/ui/components/ui/number-field";

export function MesoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 px-0.5 text-[12px]">
        <span>{label}</span>
        <span className="truncate text-[11px] text-muted-foreground tabular-nums">
          {KoreanNumber.format(value)} 메소
        </span>
      </div>
      <NumberField
        value={value === 0 ? null : value}
        min={0}
        max={MAX_MESO}
        step={1}
        format={{ maximumFractionDigits: 0 }}
        onValueChange={(v) => onChange(v ?? 0)}
      >
        <NumberFieldGroup className="w-full">
          <NumberFieldInput aria-label={label} placeholder="0" className="text-right" />
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}
