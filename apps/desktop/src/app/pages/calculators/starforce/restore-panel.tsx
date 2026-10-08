import { BASE_RESTORE_STAR, KoreanNumber, restoreCost, type RestoreMode, type StarforceOptions } from "@erda/core";

import { SfBox, SfButton } from "./sf-parts.tsx";

function Choice({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <SfButton className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2" onClick={onClick}>
      <span className="text-[13px]">{title}</span>
      <span className="text-[10px] font-medium text-(--sf-text)/80">{detail}</span>
    </SfButton>
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
    <SfBox title="TRACE TRANSFER" className="border-(--sf-danger)/50">
      <p className="m-0 mb-2 text-center text-[12px]">
        장비가 파괴됐어요. <span className="font-bold text-(--sf-gold)">★{trace}</span> 흔적이 남았어요.
      </p>
      <div className="flex gap-2">
        <Choice
          title={`★${trace} 확정 복구`}
          detail={`스페어 ${full.spares}개 · ${KoreanNumber.format(full.meso)}${full.estimated ? "(추정)" : ""}${spareNote(full.spares)}`}
          onClick={() => onRestore("full")}
        />
        <Choice
          title={`★${BASE_RESTORE_STAR} 복구`}
          detail={`스페어 1개 · 0 메소${spareNote(1)}`}
          onClick={() => onRestore("base")}
        />
      </div>
    </SfBox>
  );
}
