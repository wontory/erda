import { Checkbox } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { Check } from "lucide-react";

type CheckCircleProps = {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label: string;
  size?: number;
  className?: string;
};

export function CheckCircle({ checked, onChange, label, size = 18, className }: CheckCircleProps) {
  const readOnly = !onChange;
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(next) => onChange?.(next)}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-white outline-none",
        "transition-[background-color,border-color,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
        "not-data-readonly:active:scale-[0.92] data-readonly:cursor-default data-checked:border-green-500 data-checked:bg-green-500",
        "motion-reduce:transition-[background-color,border-color] motion-reduce:active:scale-100",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Checkbox.Indicator
        keepMounted
        className={cn(
          "flex transition-[opacity,scale] duration-150 ease-snappy",
          "data-unchecked:scale-50 data-unchecked:opacity-0 data-unchecked:duration-100",
          "motion-reduce:scale-100! motion-reduce:transition-opacity",
        )}
      >
        <Check size={size * 0.65} strokeWidth={3} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
