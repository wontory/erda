import { useState } from "react";

export function RollingValue({ value }: { value: string }) {
  const [seen, setSeen] = useState(value);
  const [changed, setChanged] = useState(false);
  if (seen !== value) {
    setSeen(value);
    setChanged(true);
  }
  return (
    <span
      key={value}
      className={
        changed
          ? "inline-block animate-in duration-150 ease-snappy fade-in slide-in-from-bottom-1 motion-reduce:slide-in-from-bottom-0"
          : undefined
      }
    >
      {value}
    </span>
  );
}
