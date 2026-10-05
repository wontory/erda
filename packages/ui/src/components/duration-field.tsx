import { cn } from "cn";
import { useState } from "react";

import { NumberField, NumberFieldGroup, NumberFieldInput } from "#/components/ui/number-field.tsx";

function splitDuration(total: number): { minutes: number; seconds: number } {
  const t = Math.max(0, Math.floor(total));
  return { minutes: Math.floor(t / 60), seconds: t % 60 };
}

function joinDuration(minutes: number, seconds: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(minutes) * 60 + Math.floor(seconds)));
}

type DurationFieldProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (seconds: number) => void;
  label: string;
  className?: string;
};

export function DurationField({ value, min = 1, max, onChange, label, className }: DurationFieldProps) {
  const { minutes, seconds } = splitDuration(value);
  const maxMinutes = Math.floor(max / 60);
  const maxSeconds = minutes >= maxMinutes ? max % 60 : 59;
  const [epoch, setEpoch] = useState(0);
  const commit = (m: number, s: number) => {
    const next = joinDuration(m, s, min, max);
    if (next !== Math.floor(m) * 60 + Math.floor(s)) setEpoch((n) => n + 1);
    onChange(next);
  };
  return (
    <fieldset aria-label={label} className={cn("flex min-w-0 items-center gap-1 text-muted-foreground", className)}>
      <DurationPart
        key={`m${epoch}`}
        value={minutes}
        max={maxMinutes}
        unit="분"
        label={label}
        onCommit={(m) => commit(m, seconds)}
      />
      <DurationPart
        key={`s${epoch}`}
        value={seconds}
        max={maxSeconds}
        unit="초"
        label={label}
        onCommit={(s) => commit(minutes, s)}
      />
    </fieldset>
  );
}

function DurationPart({
  value,
  max,
  unit,
  label,
  onCommit,
}: {
  value: number;
  max: number;
  unit: string;
  label: string;
  onCommit: (value: number) => void;
}) {
  return (
    <>
      <NumberField value={value} min={0} max={max} onValueCommitted={(v) => onCommit(v ?? 0)}>
        <NumberFieldGroup>
          <NumberFieldInput aria-label={`${label} ${unit}`} className="w-10" />
        </NumberFieldGroup>
      </NumberField>
      <span>{unit}</span>
    </>
  );
}
