import { MVP_GRADES, MVP_LABELS, SHINING_STARFORCE, type StarforceOptions } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { Switch } from "@erda/ui/components/ui/switch";
import { useId } from "react";

import { MesoField } from "#/app/pages/calculators/shared/meso-field.tsx";
import { SheetBody, SheetHeader, SheetLayout, SheetTitle } from "#/sheet/sheet-layout.tsx";

type Flag = Exclude<keyof StarforceOptions, "mvp">;

const EVENT_FLAGS: ReadonlyArray<readonly [Flag, string]> = [
  ["discount30", "강화 비용 30% 할인"],
  ["destroyReduction", "21성 이하 파괴 확률 30% 감소"],
  ["guarantee51015", "5·10·15성 강화 100% 성공"],
  ["plusOne", "10성 이하 강화 시 1+1"],
  ["restoreDiscount", "흔적 복구 비용 20% 할인"],
];

function FlagRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex h-8 items-center justify-between gap-2 text-[13px]">
      <span>{label}</span>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={(on) => onChange(on)} />
    </label>
  );
}

export function OptionsSheet({
  options,
  sparePrice,
  onOptions,
  onSparePrice,
}: {
  options: StarforceOptions;
  sparePrice: number;
  onOptions: (options: StarforceOptions) => void;
  onSparePrice: (price: number) => void;
}) {
  const set = (patch: Partial<StarforceOptions>) => onOptions({ ...options, ...patch });
  const shining = Object.entries(SHINING_STARFORCE).every(([k, v]) => options[k as Flag] === v);
  return (
    <SheetLayout>
      <SheetHeader>
        <SheetTitle>이벤트·할인</SheetTitle>
      </SheetHeader>
      <SheetBody>
        <div className="flex flex-col gap-3 py-0.5">
          <Button
            variant={shining ? "default" : "outline"}
            onClick={() =>
              set(shining ? { discount30: false, destroyReduction: false, restoreDiscount: false } : SHINING_STARFORCE)
            }
          >
            샤이닝 스타포스 {shining ? "끄기" : "켜기"}
          </Button>
          <div className="flex flex-col gap-2">
            {EVENT_FLAGS.map(([flag, label]) => (
              <FlagRow key={flag} label={label} checked={options[flag]} onChange={(on) => set({ [flag]: on })} />
            ))}
          </div>
          <div className="flex flex-col gap-1.5 text-[12px]">
            <span>MVP 등급</span>
            <div className="grid grid-cols-4 gap-1">
              {MVP_GRADES.map((g) => (
                <Button key={g} variant={options.mvp === g ? "default" : "outline"} onClick={() => set({ mvp: g })}>
                  {MVP_LABELS[g]}
                </Button>
              ))}
            </div>
          </div>
          <FlagRow label="프리미엄 PC방" checked={options.pcRoom} onChange={(pcRoom) => set({ pcRoom })} />
          <MesoField label="스페어 장비 가격" value={sparePrice} onChange={onSparePrice} />
        </div>
      </SheetBody>
    </SheetLayout>
  );
}
