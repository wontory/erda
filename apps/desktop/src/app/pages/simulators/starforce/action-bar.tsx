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
        <button
          type="button"
          aria-label="규칙 안내"
          className="grid size-7 place-items-center rounded-md bg-(--sf-pill) text-[12px] font-semibold text-(--sf-text) transition-[background-color,scale] duration-150 ease-out outline-none hover:bg-foreground/15 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.95]"
          onClick={onOpenInfo}
        >
          ?
        </button>
        <button
          type="button"
          className="h-7 rounded-md bg-(--sf-pill) px-2.5 text-[11px] font-medium text-(--sf-text) transition-[background-color,scale] duration-150 ease-out outline-none hover:bg-foreground/15 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.95]"
          onClick={onOpenOptions}
        >
          이벤트·할인
        </button>
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
