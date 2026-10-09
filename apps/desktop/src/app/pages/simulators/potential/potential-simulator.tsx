import { describeError } from "@erda/api/errors";
import {
  POTENTIAL_KINDS,
  POTENTIAL_KIND_LABELS,
  hasPendingUpgrade,
  matchLines,
  resetMeso,
  tripleAllowed,
  supportsKind,
  upgradeOdds,
  type PotentialData,
  type PotentialGoal,
  type PotentialKind,
  type PotentialSettings,
} from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import { SideSheet } from "#/features/sheet/side-sheet.tsx";

import { ActionBar } from "./action-bar.tsx";
import { ConcealedCard, RevealFlash } from "./concealed-card.tsx";
import { ItemHeader } from "./item-header.tsx";
import { ItemSheetHost } from "./item-sheet-host.tsx";
import type { ItemDraft } from "./item-sheet.tsx";
import { LedgerModule } from "./ledger-module.tsx";
import { OddsRow } from "./odds-row.tsx";
import { RollCard } from "./roll-card.tsx";
import { SettingsModule } from "./settings-module.tsx";
import { usePotentialData } from "./use-potential-data.ts";
import { AUTO_LIMIT, targetOf, usePotentialSession } from "./use-potential-session.ts";
import { usePotentialSettings } from "./use-potential-settings.ts";

export function PotentialSimulator() {
  const { settings, loaded, patch } = usePotentialSettings();
  const data = usePotentialData();
  if (data.error) return <ErrorRow message={describeError(data.error)} onRetry={() => void data.refetch()} />;
  if (!loaded || !data.data) return <LoadingRow label="옵션표 불러오는 중…" />;
  return <PotentialScreen data={data.data} settings={settings} patch={patch} />;
}

function draftOf(settings: PotentialSettings): ItemDraft {
  const start = {} as ItemDraft["start"];
  for (const k of POTENTIAL_KINDS) {
    start[k] = { grade: settings.start[k].grade, texts: settings.start[k].lines.map((l) => l.text) };
  }
  return { item: settings.item, part: settings.part, level: settings.level, soulStep: settings.soulStep, start };
}

function PotentialScreen({
  data,
  settings,
  patch,
}: {
  data: PotentialData;
  settings: PotentialSettings;
  patch: (p: Partial<PotentialSettings>) => void;
}) {
  const [dialog, setDialog] = useState<"item" | "info" | "auto" | null>(null);
  const reduced = useReducedMotion() ?? false;
  const [kindWanted, setKindWanted] = useState(settings.kind);
  const session = usePotentialSession(data, settings, kindWanted);
  const { kind, config, state, last } = session;
  const target = useMemo(() => targetOf(config, kind), [config, kind]);
  const busy = session.auto || session.autoElsewhere;
  const animate = settings.effects && !reduced && !session.auto && last !== null;
  const burst = animate && last?.upgraded ? last.id : null;
  const [flipped, setFlipped] = useState<number | null>(null);
  const selectKind = (k: PotentialKind) => {
    setKindWanted(k);
    patch({ kind: k });
  };

  const apply = (d: ItemDraft) => {
    const start = {} as PotentialSettings["start"];
    for (const k of POTENTIAL_KINDS) {
      const t = { kind: k, part: d.part, level: d.level, soulStep: d.soulStep };
      start[k] = { grade: d.start[k].grade, lines: matchLines(data, t, d.start[k].grade, d.start[k].texts) };
    }
    const next: PotentialSettings = {
      ...settings,
      item: d.item,
      part: d.part,
      level: d.level,
      soulStep: d.soulStep,
      start,
      kind: supportsKind(kindWanted, d.part) ? kindWanted : "main",
    };
    patch(next);
    session.restart(next);
    setKindWanted(next.kind);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Module>
        <div className="flex flex-col gap-3">
          <ItemHeader
            item={settings.item}
            part={config.part}
            level={config.level}
            soulStep={config.soulStep}
            grade={state?.current.grade ?? null}
            burst={burst}
            disabled={busy}
            onEdit={() => setDialog("item")}
          />
          <Tabs value={kind} onValueChange={(v) => selectKind(v as PotentialKind)}>
            <TabsList className="w-full">
              {POTENTIAL_KINDS.map((k) => (
                <TabsTrigger key={k} value={k} disabled={busy || !supportsKind(k, config.part)}>
                  {POTENTIAL_KIND_LABELS[k]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {state ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <RollCard
                  title="BEFORE"
                  roll={state.current}
                  action={
                    session.auto ? null : (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={state.pending.length === 0}
                        onClick={() => session.choose("before")}
                      >
                        BEFORE 유지
                      </Button>
                    )
                  }
                />
                {Array.from({ length: Math.max(1, state.pending.length) }, (_, i) => {
                  const roll = state.pending[i] ?? null;
                  if (session.concealed.includes(i)) {
                    return (
                      <ConcealedCard
                        key={`concealed-${i}`}
                        animate={settings.effects && !reduced}
                        onReveal={() => {
                          setFlipped(i);
                          session.reveal(i);
                        }}
                      />
                    );
                  }
                  const flash = flipped === i && settings.effects && !reduced;
                  return (
                    <div key={i} className="relative flex min-w-0 *:flex-1">
                      <RollCard
                        title="AFTER"
                        roll={roll}
                        revealId={last?.id}
                        animate={animate}
                        gradeUp={burst !== null && !!roll?.upgraded}
                        action={
                          session.auto ? null : (
                            <Button className="w-full" disabled={!roll} onClick={() => session.choose(i)}>
                              AFTER 적용
                            </Button>
                          )
                        }
                      />
                      {flash ? <RevealFlash onDone={() => setFlipped(null)} /> : null}
                    </div>
                  );
                })}
              </div>
              <OddsRow
                odds={upgradeOdds(kind, state.current.grade, state.pity)}
                pity={state.pity}
                cost={resetMeso(target, state.current.grade)}
              />
            </>
          ) : (
            <p className="m-0 text-[12px] text-muted-foreground">이 부위와 레벨에는 공개된 옵션표가 없어요.</p>
          )}
          <ActionBar
            canReset={state !== null && !session.autoElsewhere && !hasPendingUpgrade(state)}
            tripleBlocked={state !== null && !tripleAllowed(kind, state.current.grade, state.pity)}
            auto={session.auto}
            onReset={session.reset}
            onStopAuto={session.stopAuto}
            onOpenAuto={() => setDialog("auto")}
            onRestart={() => session.restart(settings)}
          />
          {session.stoppedAtLimit ? (
            <p className="m-0 text-[12px] text-muted-foreground">
              자동 재설정은 한 번에 {AUTO_LIMIT.toLocaleString()}회까지만 돌려요. 목표를 바꿔 보세요.
            </p>
          ) : null}
        </div>
      </Module>
      {state ? <LedgerModule kind={kind} ledger={state.ledger} /> : null}
      <SettingsModule
        item={settings.item}
        part={config.part}
        level={config.level}
        soulStep={config.soulStep}
        onEditItem={() => setDialog("item")}
        effects={settings.effects}
        onEffects={(effects) => patch({ effects })}
        onOpenInfo={() => setDialog("info")}
      />
      {dialog === "item" ? (
        <ItemSheetHost initial={draftOf(settings)} onApply={apply} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "auto" && state ? (
        <SideSheet
          kind="potential-auto"
          props={{ target, current: state.current.grade, goal: settings.goals[kind] }}
          onResult={(type, value) => {
            if (type !== "start") return;
            const { goal, times } = value as { goal: PotentialGoal; times: number };
            patch({ goals: { ...settings.goals, [kind]: goal } });
            session.startAuto(goal, times);
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "info" ? (
        <SideSheet
          kind="potential-info"
          props={{ dataDate: data.POTENTIAL_DATA_DATE }}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
