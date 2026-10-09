import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@erda/ui/components/ui/field";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@erda/ui/components/ui/number-field";
import { Switch } from "@erda/ui/components/ui/switch";
import { listItem } from "@erda/ui/lib/motion";
import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";

import { DESCRIPTION, LABEL, ROW } from "./field.ts";

export function SettingRow({
  label,
  htmlFor,
  labelId,
  description,
  descriptionClassName,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  labelId?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  children: ReactNode;
}) {
  return (
    <Field orientation="horizontal" className={ROW}>
      <FieldContent>
        {htmlFor ? (
          <FieldLabel id={labelId} htmlFor={htmlFor} className={LABEL}>
            {label}
          </FieldLabel>
        ) : (
          <FieldTitle className={LABEL}>{label}</FieldTitle>
        )}
        <AnimatePresence initial={false}>
          {description ? (
            <m.div key="description" {...listItem}>
              <FieldDescription
                className={descriptionClassName ? `${DESCRIPTION} ${descriptionClassName}` : DESCRIPTION}
              >
                {description}
              </FieldDescription>
            </m.div>
          ) : null}
        </AnimatePresence>
      </FieldContent>
      {children}
    </Field>
  );
}

export function SettingSwitch({
  id,
  labelId,
  checked,
  onCheckedChange,
}: {
  id: string;
  labelId: string;
  checked: boolean | null;
  onCheckedChange: (checked: boolean) => void;
}) {
  if (checked === null) return <span className="h-[14px] w-6 shrink-0" aria-hidden />;
  return (
    <Switch size="sm" id={id} aria-labelledby={labelId} checked={checked} onCheckedChange={(v) => onCheckedChange(v)} />
  );
}

export function SettingNumber({
  id,
  value,
  min,
  max,
  step,
  inputClassName = "w-12",
  unit,
  onCommit,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  inputClassName?: string;
  unit?: string;
  onCommit: (value: number) => void;
}) {
  return (
    <NumberField
      id={id}
      value={value}
      min={min}
      max={max}
      step={step}
      className="shrink-0"
      onValueCommitted={(v) => {
        if (v !== null && v !== value) onCommit(v);
      }}
    >
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput className={inputClassName} />
        <NumberFieldIncrement />
      </NumberFieldGroup>
      {unit ? <span className="text-muted-foreground">{unit}</span> : null}
    </NumberField>
  );
}
