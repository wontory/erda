import { KoreanNumber, type BossSplit, type SplitShare } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { Module } from "@erda/ui/components/module";
import { Swap } from "@erda/ui/components/swap";
import { Badge } from "@erda/ui/components/ui/badge";
import { Button } from "@erda/ui/components/ui/button";
import { listItem } from "@erda/ui/lib/motion";
import { toastManager } from "@erda/ui/lib/toast";
import { Copy, HandCoins } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { runAction } from "#/lib/action.ts";

const percentText = (p: number) => `${Math.round(p * 10) / 10}%`;
const gapRateText = (rate: number) => (rate < 0.00001 ? "0.00001% 미만" : `${rate.toFixed(5)}%`);

async function copyMeso(amount: number) {
  await navigator.clipboard.writeText(String(amount));
  toastManager.add({ type: "success", title: `${KoreanNumber.grouped(amount)} 메소를 복사했어요` });
}

function ShareRow({
  share,
  label,
  note,
  showPercent,
}: {
  share: SplitShare;
  label: string;
  note: string;
  showPercent: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px]">
          {label}
          {showPercent ? (
            <Badge variant="outline" className="tabular-nums">
              {percentText(share.percent)}
            </Badge>
          ) : null}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{note}</div>
      </div>
      <div className="min-w-0 text-right">
        <div className="text-[15px] font-semibold tabular-nums">{KoreanNumber.grouped(share.amount)}</div>
        <div className="truncate text-[11px] text-muted-foreground tabular-nums">
          {KoreanNumber.format(share.amount)} 메소
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${label} 금액 복사`}
        title="복사"
        onClick={() => void runAction(() => copyMeso(share.amount), "복사하지 못했어요")}
      >
        <Copy />
      </Button>
    </div>
  );
}

function memberNote(share: SplitShare) {
  return `전달 금액(수수료 포함) · 받는 돈 ${KoreanNumber.format(share.received)}`;
}

export function ResultModule({ split, byRatio }: { split: BossSplit | null; byRatio: boolean }) {
  if (!split) {
    const text = byRatio
      ? "비율 합계가 0이에요. 한 칸 이상 숫자를 넣어 주세요."
      : "판매 금액을 넣으면 분배 금액이 나와요.";
    return (
      <Module title="분배 결과" icon={HandCoins}>
        <AutoHeight>
          <Swap id="empty">
            <div className="px-0.5 text-[11px] text-muted-foreground">{text}</div>
          </Swap>
        </AutoHeight>
      </Module>
    );
  }
  const { leader, members } = split;
  const [first] = members;
  const memberRows = byRatio
    ? members.map((member) => ({ share: member, label: member.label }))
    : [{ share: first, label: members.length > 1 ? `파티원 ${members.length}명 각자` : first.label }];
  return (
    <Module title="분배 결과" icon={HandCoins}>
      <AutoHeight>
        <Swap id="results">
          <ShareRow share={leader} label={leader.label} note="실수령 기준 남는 몫" showPercent={byRatio} />
          <AnimatePresence initial={false}>
            {memberRows.map(({ share, label }) => (
              <m.div key={share.label} {...listItem}>
                <ShareRow share={share} label={label} note={memberNote(share)} showPercent={byRatio} />
              </m.div>
            ))}
          </AnimatePresence>
          <div className="flex flex-col px-2 pt-1.5 text-[11px] text-muted-foreground">
            <AnimatePresence initial={false}>
              {byRatio ? null : (
                <m.span key="gap" {...listItem} className="tabular-nums">
                  <span className="block pb-0.5">
                    파티장과 파티원 차이 {KoreanNumber.grouped(split.gap)} 메소 · {gapRateText(split.gapRate)}
                  </span>
                </m.span>
              )}
            </AnimatePresence>
            <span>파티원 몫은 100메소 단위로 내리고, 남는 돈은 파티장이 가져요.</span>
          </div>
        </Swap>
      </AutoHeight>
    </Module>
  );
}
