import { cn } from "cn";
import { useState } from "react";

function ringOffset(value: number, max: number, circumference: number): number {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return circumference * (1 - pct);
}

function isRollover(prev: number, next: number): boolean {
  return next > prev;
}

type RingGaugeProps = {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  tint?: string;
  label?: string;
  className?: string;
};

export function RingGauge({
  value,
  max,
  size = 28,
  stroke = 3,
  tint = "text-primary",
  label,
  className,
}: RingGaugeProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const half = size / 2;
  const [prev, setPrev] = useState(value);
  const [rollover, setRollover] = useState(false);
  if (prev !== value) {
    setPrev(value);
    setRollover(isRollover(prev, value));
  }
  const a11y = label
    ? { role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": value }
    : { "aria-hidden": true };
  const circle = { cx: half, cy: half, r, fill: "none", stroke: "currentColor", strokeWidth: stroke };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...a11y}
      className={cn("shrink-0", tint, className)}
    >
      <circle {...circle} strokeOpacity={0.15} />
      <circle
        {...circle}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={ringOffset(value, max, c)}
        transform={`rotate(-90 ${half} ${half})`}
        style={rollover ? { transition: "none" } : undefined}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
      />
    </svg>
  );
}
