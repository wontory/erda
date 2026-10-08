import { Button } from "@erda/ui/components/ui/button";
import { FastForward, RotateCcw, Square } from "lucide-react";

export function ActionBar({
  canEnhance,
  busy,
  auto,
  onEnhance,
  onStopAuto,
  onOpenAuto,
  onRestart,
}: {
  canEnhance: boolean;
  busy: boolean;
  auto: boolean;
  onEnhance: () => void;
  onStopAuto: () => void;
  onOpenAuto: () => void;
  onRestart: () => void;
}) {
  if (auto) {
    return (
      <Button size="lg" variant="destructive" className="h-10 w-full text-[14px]" onClick={onStopAuto}>
        <Square className="fill-current" />
        자동 강화 중지
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button
        size="icon-lg"
        variant="outline"
        className="size-10"
        aria-label="처음부터 다시"
        title="처음부터 다시 (시작 성으로 되돌리고 기록 지우기)"
        disabled={busy}
        onClick={onRestart}
      >
        <RotateCcw />
      </Button>
      <Button size="lg" className="h-10 flex-1 text-[14px]" disabled={!canEnhance || busy} onClick={onEnhance}>
        강화하기
      </Button>
      <Button size="lg" variant="outline" className="h-10" disabled={!canEnhance || busy} onClick={onOpenAuto}>
        <FastForward />
        자동
      </Button>
    </div>
  );
}
