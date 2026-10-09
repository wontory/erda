import {
  PLUS_ONE_MAX_STAR,
  attemptCost,
  canEnhance,
  chances,
  isGuaranteed,
  isProtectable,
  maxStar,
  type StarforceOptions,
  type StarforceSettings,
} from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { Module } from "@erda/ui/components/module";
import { fade } from "@erda/ui/lib/motion";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { SideSheet } from "#/features/sheet/side-sheet.tsx";

import { ActionBar } from "./action-bar.tsx";
import { ChanceBox } from "./chance-box.tsx";
import { CostRow } from "./cost-row.tsx";
import { EnchantEffect } from "./enchant-effect.tsx";
import { ItemSlot } from "./item-panel.tsx";
import { ItemSheetHost } from "./item-sheet-host.tsx";
import { LedgerBox } from "./ledger-box.tsx";
import { RestorePanel } from "./restore-panel.tsx";
import { SettingsModule } from "./settings-module.tsx";
import { StarTrack } from "./star-track.tsx";
import { SF_THEME } from "./theme.ts";
import { useStarforceSession } from "./use-starforce-session.ts";
import { useStarforceSettings } from "./use-starforce-settings.ts";

export function StarforceSimulator() {
  const { settings, loaded, patch } = useStarforceSettings();
  return loaded ? <StarforceScreen settings={settings} patch={patch} /> : null;
}

function StarforceScreen({
  settings,
  patch,
}: {
  settings: StarforceSettings;
  patch: (p: Partial<StarforceSettings>) => void;
}) {
  const [dialog, setDialog] = useState<"item" | "options" | "info" | "auto" | null>(null);
  const session = useStarforceSession(settings);
  const { state, last, protect } = session;
  const { options } = settings;
  const cap = maxStar(state.level);
  const step = options.plusOne && state.star <= PLUS_ONE_MAX_STAR ? 2 : 1;
  const next = state.star < cap ? Math.min(state.star + step, cap) : null;
  const protectable = isProtectable(state.star) && !isGuaranteed(state.star, options) && !session.auto;
  const effectiveProtect = session.auto ? session.autoProtect.includes(state.star) : protect && protectable;
  const popFrom = settings.effects && last?.outcome === "success" ? last.from : null;

  return (
    <div style={SF_THEME} className="flex flex-col gap-2.5">
      <Module>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-label="장비 설정"
            disabled={session.auto || session.phase !== "idle"}
            onClick={() => setDialog("item")}
            className="-m-1 flex items-center gap-3 rounded-[calc(var(--radius-2xl)-9px)] p-1 text-left transition-colors duration-100 ease-out outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-foreground/10 disabled:pointer-events-none"
          >
            <ItemSlot
              item={settings.item}
              destroyed={state.trace !== null}
              charging={session.phase === "charging"}
              pulse={
                settings.effects && !session.auto && last && session.phase === "result"
                  ? { id: last.id, kind: last.outcome === "success" ? "pop" : "shake" }
                  : null
              }
              overlay={
                settings.effects && !session.auto ? (
                  <EnchantEffect phase={session.phase} last={last} />
                ) : last ? (
                  <m.span
                    key={last.id}
                    className={`pointer-events-none absolute inset-0 rounded-[calc(var(--radius-2xl)-14px)] ${
                      last.outcome === "success"
                        ? "bg-(--sf-gold)/50"
                        : last.outcome === "destroyed"
                          ? "bg-(--sf-danger)/50"
                          : "bg-(--sf-text)/15"
                    }`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                ) : null
              }
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[14px] font-semibold">
                {settings.item ? settings.item.name : "직접 입력한 장비"}
              </span>
              <span className="truncate text-[12px] text-muted-foreground">
                {settings.item ? `${settings.item.part} · ` : ""}Lv.{state.level}
                {state.trace !== null ? <span className="text-destructive"> · 파괴됨</span> : null}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
          <StarTrack star={state.star} cap={cap} next={next} popFrom={popFrom} />
          <div className="-mt-3">
            <AutoHeight>
              <AnimatePresence initial={false} mode="popLayout">
                {state.trace !== null ? (
                  <m.div key="restore" {...fade} className="pt-3">
                    <RestorePanel
                      level={state.level}
                      trace={state.trace}
                      options={options}
                      sparePrice={settings.sparePrice}
                      onRestore={session.restoreWith}
                    />
                  </m.div>
                ) : next !== null ? (
                  <m.div key="enhance" {...fade} className="flex flex-col gap-3 pt-3">
                    <ChanceBox chances={chances(state.star, options, effectiveProtect)} />
                    <CostRow
                      cost={attemptCost(state.level, state.star, options, effectiveProtect)}
                      protect={protect}
                      protectable={protectable}
                      onProtect={session.setProtect}
                    />
                  </m.div>
                ) : null}
              </AnimatePresence>
            </AutoHeight>
          </div>
          <ActionBar
            canEnhance={canEnhance(state)}
            busy={session.phase !== "idle"}
            auto={session.auto}
            onEnhance={session.attempt}
            onStopAuto={session.stopAuto}
            onOpenAuto={() => setDialog("auto")}
            onRestart={() => session.reset(settings.level, settings.startStar)}
          />
        </div>
      </Module>
      <LedgerBox ledger={state.ledger} sparePrice={settings.sparePrice} />
      <SettingsModule
        item={settings.item}
        level={settings.level}
        startStar={settings.startStar}
        destroyed={state.trace !== null}
        options={options}
        effects={settings.effects}
        onEditItem={() => setDialog("item")}
        onOpenOptions={() => setDialog("options")}
        onEffects={(effects) => patch({ effects })}
        onOpenInfo={() => setDialog("info")}
      />
      {dialog === "item" ? (
        <ItemSheetHost
          item={settings.item}
          level={settings.level}
          startStar={settings.startStar}
          onApply={(item, level, startStar) => {
            patch({ item, level, startStar });
            session.reset(level, startStar);
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "options" ? (
        <SideSheet
          kind="starforce-options"
          props={{ options, sparePrice: settings.sparePrice }}
          onResult={(type, value) => {
            if (type === "options") patch({ options: value as StarforceOptions });
            if (type === "sparePrice") patch({ sparePrice: value as number });
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "info" ? <SideSheet kind="starforce-info" props={null} onClose={() => setDialog(null)} /> : null}
      {dialog === "auto" ? (
        <SideSheet
          kind="starforce-auto"
          props={{ star: state.star, cap, target: settings.autoTarget, protectStars: settings.autoProtect }}
          onResult={(type, value) => {
            if (type !== "start") return;
            const { target, protect } = value as { target: number; protect: number[] };
            patch({ autoTarget: target, autoProtect: protect });
            session.startAuto(target, protect);
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
