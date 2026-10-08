import { Switch } from "@erda/ui/components/ui/switch";
import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";

export function SfBox({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-(--sf-box-edge) bg-(--sf-box) px-2.5 py-2 ${className}`}>
      {title ? <h3 className="m-0 mb-1 text-[11px] font-semibold text-(--sf-muted)">{title}</h3> : null}
      {children}
    </section>
  );
}

export function SfSwitchRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between gap-2 text-[11px] ${disabled ? "opacity-45" : ""}`}
    >
      <span>{label}</span>
      <Switch id={id} size="sm" checked={checked} disabled={disabled} onCheckedChange={(on) => onChange(on)} />
    </label>
  );
}

export function SfButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg bg-primary font-semibold text-primary-foreground transition-[filter,scale] duration-150 ease-out outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
