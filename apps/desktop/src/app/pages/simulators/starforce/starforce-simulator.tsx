import {
  PLUS_ONE_MAX_STAR,
  attemptCost,
  canEnhance,
  chances,
  isGuaranteed,
  isProtectable,
  maxStar,
  type StarforceSettings,
} from "@erda/core";
import { m } from "motion/react";
import { useState } from "react";

import { ActionBar } from "./action-bar.tsx";
import { AutoDialog } from "./auto-dialog.tsx";
import { ChanceBox } from "./chance-box.tsx";
import { CostRow } from "./cost-row.tsx";
import { EnchantEffect } from "./enchant-effect.tsx";
import { InfoDialog } from "./info-dialog.tsx";
import { ItemDialog } from "./item-dialog.tsx";
import { ItemPanel } from "./item-panel.tsx";
import { LedgerBox } from "./ledger-box.tsx";
import { OptionsDialog } from "./options-dialog.tsx";
import { RestorePanel } from "./restore-panel.tsx";
import { StarTrack } from "./star-track.tsx";
import { SF_PANEL, SF_THEME } from "./theme.ts";
import { useStarforceSession } from "./use-starforce-session.ts";
import { useStarforceSettings } from "./use-starforce-settings.ts";

export function StarforceSimulator() {
  const { settings, loaded, patch } = useStarforceSettings();
  // The session seeds from the saved item once, so wait for the store read.
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
      <section className={`${SF_PANEL} flex flex-col gap-3`}>
        <ItemPanel
          level={state.level}
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
                className={`pointer-events-none absolute inset-0 rounded-md ${
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
          onEditItem={() => setDialog("item")}
        />
        <StarTrack star={state.star} cap={cap} next={next} popFrom={popFrom} />
        {state.trace !== null ? (
          <RestorePanel
            level={state.level}
            trace={state.trace}
            options={options}
            sparePrice={settings.sparePrice}
            onRestore={session.restoreWith}
          />
        ) : next !== null ? (
          <>
            <ChanceBox chances={chances(state.star, options, effectiveProtect)} />
            <CostRow
              cost={attemptCost(state.level, state.star, options, effectiveProtect)}
              protect={protect}
              protectable={protectable}
              onProtect={session.setProtect}
            />
          </>
        ) : null}
        <ActionBar
          canEnhance={canEnhance(state)}
          busy={session.phase !== "idle"}
          auto={session.auto}
          effects={settings.effects}
          onEnhance={session.attempt}
          onStopAuto={session.stopAuto}
          onOpenAuto={() => setDialog("auto")}
          onEffects={(effects) => patch({ effects })}
          onOpenInfo={() => setDialog("info")}
          onOpenOptions={() => setDialog("options")}
        />
      </section>
      <LedgerBox
        ledger={state.ledger}
        sparePrice={settings.sparePrice}
        onReset={() => session.reset(settings.level, settings.startStar)}
      />
      {dialog === "item" ? (
        <ItemDialog
          open={dialog === "item"}
          level={settings.level}
          startStar={settings.startStar}
          onOpenChange={(open) => setDialog(open ? "item" : null)}
          onApply={(level, startStar) => {
            patch({ level, startStar });
            session.reset(level, startStar);
          }}
        />
      ) : null}
      <OptionsDialog
        open={dialog === "options"}
        options={options}
        sparePrice={settings.sparePrice}
        onOpenChange={(open) => setDialog(open ? "options" : null)}
        onOptions={(next) => patch({ options: next })}
        onSparePrice={(sparePrice) => patch({ sparePrice })}
      />
      <InfoDialog open={dialog === "info"} onOpenChange={(open) => setDialog(open ? "info" : null)} />
      {dialog === "auto" ? (
        <AutoDialog
          open={dialog === "auto"}
          star={state.star}
          cap={cap}
          target={settings.autoTarget}
          protectStars={settings.autoProtect}
          onOpenChange={(open) => setDialog(open ? "auto" : null)}
          onStart={(autoTarget, autoProtect) => {
            patch({ autoTarget, autoProtect });
            session.startAuto(autoTarget, autoProtect);
          }}
        />
      ) : null}
    </div>
  );
}
