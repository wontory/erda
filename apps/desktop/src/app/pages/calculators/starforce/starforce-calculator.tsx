import { PLUS_ONE_MAX_STAR, attemptCost, canEnhance, chances, isGuaranteed, isProtectable, maxStar } from "@erda/core";

import { ActionBar } from "./action-bar.tsx";
import { ChanceBox } from "./chance-box.tsx";
import { CostRow } from "./cost-row.tsx";
import { ItemPanel } from "./item-panel.tsx";
import { LedgerBox } from "./ledger-box.tsx";
import { StarTrack } from "./star-track.tsx";
import { SF_PANEL, SF_THEME } from "./theme.ts";
import { useStarforceSession } from "./use-starforce-session.ts";
import { useStarforceSettings } from "./use-starforce-settings.ts";

export function StarforceCalculator() {
  const { settings, patch } = useStarforceSettings();
  const session = useStarforceSession(settings);
  const { state, last, protect } = session;
  const { options } = settings;
  const cap = maxStar(state.level);
  const step = options.plusOne && state.star <= PLUS_ONE_MAX_STAR ? 2 : 1;
  const next = state.star < cap ? Math.min(state.star + step, cap) : null;
  const protectable = isProtectable(state.star) && !isGuaranteed(state.star, options) && !session.auto;
  const popFrom = settings.effects && last?.outcome === "success" ? last.from : null;

  return (
    <div style={SF_THEME} className="flex flex-col gap-2">
      <ItemPanel
        level={state.level}
        destroyed={state.trace !== null}
        charging={session.phase === "charging"}
        shakeKey={null}
        onEditItem={() => {}}
      />
      <section className={`${SF_PANEL} flex flex-col gap-2`}>
        <StarTrack star={state.star} cap={cap} next={next} popFrom={popFrom} />
        <LedgerBox
          ledger={state.ledger}
          sparePrice={settings.sparePrice}
          onReset={() => session.reset(settings.level, settings.startStar)}
        />
        {next !== null ? (
          <>
            <ChanceBox chances={chances(state.star, options, protect && protectable)} />
            <CostRow
              cost={attemptCost(state.level, state.star, options, protect && protectable)}
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
          onOpenAuto={() => {}}
          onEffects={(effects) => patch({ effects })}
          onOpenInfo={() => {}}
          onOpenOptions={() => {}}
        />
      </section>
    </div>
  );
}
