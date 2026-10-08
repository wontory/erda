import { SfButton, SfSwitchRow } from "./sf-parts.tsx";

export function ActionBar({
  canEnhance,
  busy,
  auto,
  effects,
  onEnhance,
  onStopAuto,
  onOpenAuto,
  onEffects,
  onOpenInfo,
  onOpenOptions,
}: {
  canEnhance: boolean;
  busy: boolean;
  auto: boolean;
  effects: boolean;
  onEnhance: () => void;
  onStopAuto: () => void;
  onOpenAuto: () => void;
  onEffects: (on: boolean) => void;
  onOpenInfo: () => void;
  onOpenOptions: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
      <div className="flex items-center gap-1">
        <SfButton aria-label="규칙 안내" className="size-6 text-[12px]" onClick={onOpenInfo}>
          ?
        </SfButton>
        <SfButton className="h-6 px-2 text-[11px]" onClick={onOpenOptions}>
          이벤트·할인
        </SfButton>
      </div>
      {auto ? (
        <SfButton className="h-9 w-28 text-[14px]" onClick={onStopAuto}>
          중지
        </SfButton>
      ) : (
        <SfButton className="h-9 w-28 text-[14px]" disabled={!canEnhance || busy} onClick={onEnhance}>
          강화하기
        </SfButton>
      )}
      <div className="flex flex-col gap-1 justify-self-end">
        <SfSwitchRow
          label="자동 강화"
          checked={auto}
          disabled={!canEnhance && !auto}
          onChange={(on) => (on ? onOpenAuto() : onStopAuto())}
        />
        <SfSwitchRow label="강화 연출" checked={effects} onChange={onEffects} />
      </div>
    </div>
  );
}
