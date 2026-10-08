import { formatChance, type Chances } from "@erda/core";

import { SfBox } from "./sf-parts.tsx";

function Row({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-[12px]">
      <span className="text-right text-(--sf-text)">{label}</span>
      <span className={`font-bold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export function ChanceBox({ chances }: { chances: Chances }) {
  return (
    <SfBox title="성공 확률">
      <Row label="성공" value={formatChance(chances.success)} />
      <Row label={chances.destroy > 0 ? "실패(유지)" : "실패"} value={formatChance(chances.fail)} />
      {chances.destroy > 0 ? (
        <Row label="파괴" value={formatChance(chances.destroy)} tone="text-(--sf-danger)" />
      ) : null}
    </SfBox>
  );
}
