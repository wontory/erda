import { BASE_RESTORE_STAR, KoreanNumber, restoreCost, type RestoreMode, type StarforceOptions } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { m } from "motion/react";
import type { ReactNode } from "react";

import { StarCount } from "./star-count.tsx";

function Choice({ title, detail, onClick }: { title: ReactNode; detail: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="h-auto flex-1 flex-col gap-0.5 py-2 whitespace-normal" onClick={onClick}>
      <span className="text-[13px] font-semibold">{title}</span>
      <span className="text-[10px] font-normal text-muted-foreground">{detail}</span>
    </Button>
  );
}

export function RestorePanel({
  level,
  trace,
  options,
  sparePrice,
  onRestore,
}: {
  level: number;
  trace: number;
  options: StarforceOptions;
  sparePrice: number;
  onRestore: (mode: RestoreMode) => void;
}) {
  const full = restoreCost(level, trace, options);
  const spareNote = (n: number) => (sparePrice > 0 ? ` + ${KoreanNumber.format(n * sparePrice)}` : "");
  return (
    <m.div
      className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2.5"
      initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
    >
      <p className="m-0 text-[12px]">
        장비가 파괴됐어요. <StarCount className="font-semibold text-(--sf-gold)">{trace}</StarCount> 흔적으로 복구할 수
        있어요.
      </p>
      <div className="flex gap-2">
        <Choice
          title={
            <>
              <StarCount>{trace}</StarCount> 확정 복구
            </>
          }
          detail={`스페어 ${full.spares}개 · ${KoreanNumber.format(full.meso)}${full.estimated ? "(추정)" : ""}${spareNote(full.spares)}`}
          onClick={() => onRestore("full")}
        />
        <Choice
          title={
            <>
              <StarCount>{BASE_RESTORE_STAR}</StarCount> 복구
            </>
          }
          detail={`스페어 1개 · 0 메소${spareNote(1)}`}
          onClick={() => onRestore("base")}
        />
      </div>
    </m.div>
  );
}
