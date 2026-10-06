import { getCharacterSymbolEquipment } from "@erda/api/generated/endpoints/character/character";
import type { CharacterSymbolEquipmentSymbolItem } from "@erda/api/generated/model";
import { summarizeSymbols, symbolDays, symbolKind, symbolMaxLevel, symbolRemaining, symbolTotal } from "@erda/core";
import { GameIcon } from "@erda/ui/components/game-icon";
import { Progress } from "@erda/ui/components/ui/progress";
import { Gem } from "lucide-react";

import { Inspectable } from "#/app/pages/character/inspector/inspectable.tsx";
import type { InspectorPayload } from "#/features/inspector/payload.ts";
import { useInspector } from "#/features/inspector/use-inspector.ts";
import { useSetting } from "#/features/settings/use-settings.ts";

import { Section } from "./section.tsx";

type SymbolEntry = {
  raw: CharacterSymbolEquipmentSymbolItem;
  name: string;
  level: number;
  growth: number;
  require: number;
};
type DailyGrowth = { arcane: number; authentic: number };

const toEntry = (s: CharacterSymbolEquipmentSymbolItem): SymbolEntry => ({
  raw: s,
  name: s.symbol_name ?? "",
  level: s.symbol_level ?? 0,
  growth: s.symbol_growth_count ?? 0,
  require: s.symbol_require_growth_count ?? 0,
});

function daysCaption(maxed: boolean, days: number | null) {
  if (maxed) return "";
  if (days === 0) return "레벨업 가능";
  if (days === null) return "성장치 설정 필요";
  return `만렙까지 약 ${days}일`;
}

function SymbolRow({
  entry: it,
  growth,
  inspector,
}: {
  entry: SymbolEntry;
  growth: DailyGrowth;
  inspector: ReturnType<typeof useInspector>;
}) {
  const kind = symbolKind(it.name);
  if (!kind) return null;
  const maxed = it.level >= symbolMaxLevel(kind);
  const remaining = symbolRemaining(kind, it.level, it.growth, it.require);
  const total = symbolTotal(kind);
  const days = symbolDays(remaining, kind === "arcane" ? growth.arcane : growth.authentic);
  const payload: InspectorPayload = {
    kind: "symbol",
    symbol: it.raw,
    level: it.level,
    growth: it.growth,
    require: it.require,
    days,
    maxed,
  };
  return (
    <Inspectable inspector={inspector} payload={payload}>
      <div className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1">
        <GameIcon src={it.raw.symbol_icon} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-[12px]">
            <span className="truncate">{it.name}</span>
            <span className={maxed ? "text-success" : ""}>Lv.{it.level}</span>
          </div>
          <Progress
            value={total - remaining}
            max={total}
            aria-label={`${it.name} 성장치`}
            className={`my-1 ${maxed ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-cyan-500"}`}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{maxed ? "만렙" : `${it.growth} / ${it.require > 0 ? it.require : "-"}`}</span>
            <span>{daysCaption(maxed, days)}</span>
          </div>
        </div>
      </div>
    </Inspectable>
  );
}

export function SymbolsSection({ ocid }: { ocid: string }) {
  const [arcane] = useSetting("settings.arcaneDailyGrowth");
  const [authentic] = useSetting("settings.authenticDailyGrowth");
  const inspector = useInspector();
  const growth = { arcane, authentic };
  return (
    <Section
      id="symbols"
      ocid={ocid}
      icon={Gem}
      fetcher={(p) => getCharacterSymbolEquipment({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const items = (d.symbol ?? []).map(toEntry);
        const summary = summarizeSymbols(items, growth);
        return (
          <>
            <div className="mb-1 px-2 text-[12px] text-muted-foreground">
              {summary.arcane ? <div>아케인 · {summary.arcane}</div> : null}
              {summary.authentic ? <div>어센틱 · {summary.authentic}</div> : null}
            </div>
            {items.map((it) => (
              <SymbolRow key={it.name} entry={it} growth={growth} inspector={inspector} />
            ))}
            <p className="px-2 pt-1 text-[11px] text-muted-foreground">
              하루 성장치 아케인 {arcane} · 어센틱 {authentic} 기준이에요. 설정 › 심볼에서 바꿀 수 있어요.
            </p>
          </>
        );
      }}
    </Section>
  );
}
