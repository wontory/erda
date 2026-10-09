import { TRIPLE_RESET_TIMES } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { FastForward, RotateCcw, Square } from "lucide-react";

export function ActionBar({
  canReset,
  tripleBlocked,
  auto,
  onReset,
  onStopAuto,
  onOpenAuto,
  onRestart,
}: {
  canReset: boolean;
  tripleBlocked: boolean;
  auto: boolean;
  onReset: (times: number) => void;
  onStopAuto: () => void;
  onOpenAuto: () => void;
  onRestart: () => void;
}) {
  if (auto) {
    return (
      <Button size="lg" variant="destructive" className="h-10 w-full text-[14px]" onClick={onStopAuto}>
        <Square className="fill-current" />
        자동 재설정 중지
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
        title="처음부터 다시 (시작 잠재능력으로 되돌리고 기록 지우기)"
        onClick={onRestart}
      >
        <RotateCcw />
      </Button>
      <Button size="lg" className="h-10 flex-1 text-[14px]" disabled={!canReset} onClick={() => onReset(1)}>
        재설정
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="h-10 flex-1 text-[14px]"
        title={
          tripleBlocked ? "확정 등급 상승까지 3회 미만으로 남아서 1회씩만 재설정할 수 있어요" : "MVP 골드 이상 혜택"
        }
        disabled={!canReset || tripleBlocked}
        onClick={() => onReset(TRIPLE_RESET_TIMES)}
      >
        {TRIPLE_RESET_TIMES}회 재설정
      </Button>
      <Button size="lg" variant="outline" className="h-10 text-[14px]" disabled={!canReset} onClick={onOpenAuto}>
        <FastForward />
        자동
      </Button>
    </div>
  );
}
