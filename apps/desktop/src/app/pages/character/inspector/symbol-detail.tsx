import type { InspectorPayload } from "#/features/inspector/payload.ts";

type SymbolPayload = Extract<InspectorPayload, { kind: "symbol" }>;
type SymbolData = SymbolPayload["symbol"];

const isShown = (v: string | null | undefined) => v && v !== "0" && v !== "0%";

function symbolStats(s: SymbolData) {
  return [
    ["STR", s.symbol_str],
    ["DEX", s.symbol_dex],
    ["INT", s.symbol_int],
    ["LUK", s.symbol_luk],
    ["HP", s.symbol_hp],
    ["드롭", s.symbol_drop_rate],
    ["메소", s.symbol_meso_rate],
    ["경험치", s.symbol_exp_rate],
  ].filter(([, v]) => isShown(v));
}

export function SymbolDetail({ payload }: { payload: SymbolPayload }) {
  const s = payload.symbol;
  return (
    <div className="h-full overflow-y-auto">
      <div className="font-semibold">{s.symbol_name}</div>
      <div className="text-muted-foreground">
        Lv.{payload.level} · 포스 {s.symbol_force}
      </div>
      <p className="mt-1 line-clamp-4 whitespace-pre-line">{s.symbol_description}</p>
      {symbolStats(s).map(([k, v]) => (
        <div key={k} className="flex justify-between">
          <span>{k}</span>
          <span>{v}</span>
        </div>
      ))}
      {s.symbol_other_effect_description ? (
        <div className="mt-1 text-muted-foreground">{s.symbol_other_effect_description}</div>
      ) : null}
    </div>
  );
}
