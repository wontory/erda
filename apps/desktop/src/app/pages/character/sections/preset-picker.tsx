import { presetNumbers } from "@erda/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@erda/ui/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { Check } from "lucide-react";

const MAX_TABS = 5;

function CurrentMark() {
  return (
    <>
      <Check className="size-3" aria-hidden />
      <span className="sr-only">(사용 중)</span>
    </>
  );
}

export function PresetPicker({
  count,
  value,
  current,
  onChange,
  label = (n) => n,
}: {
  count: number;
  value: string;
  current: string | null;
  onChange: (v: string) => void;
  label?: (n: string) => string;
}) {
  const options = presetNumbers(count);
  const mark = (n: string) => (n === current ? <CurrentMark /> : null);
  if (count <= MAX_TABS) {
    return (
      <Tabs value={value} onValueChange={(v) => onChange(String(v))} className="mb-2">
        <TabsList className="w-full" aria-label="프리셋">
          {options.map((n) => (
            <TabsTrigger key={n} value={n}>
              {label(n)}
              {mark(n)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }
  return (
    <Select value={value} onValueChange={(v) => onChange(String(v))}>
      <SelectTrigger className="h-7 w-32" aria-label="프리셋">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((n) => (
          <SelectItem key={n} value={n}>
            {label(n)}
            {mark(n)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
