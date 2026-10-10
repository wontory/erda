import { describeError } from "@erda/api/errors";
import {
  POTENTIAL_GRADE_LABELS,
  POTENTIAL_KINDS,
  POTENTIAL_KIND_LABELS,
  canAutoFrom,
  canUseMethod,
  lineTables,
  formatMeso,
  hasPendingUpgrade,
  methodRule,
  methodsOf,
  pityOf,
  matchLines,
  resetMeso,
  tripleAllowed,
  supportsKind,
  upgradeOdds,
  type PotentialData,
  type PotentialGoal,
  type PotentialKind,
  type PotentialMethod,
  type PotentialSettings,
} from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { StackItem } from "@erda/ui/components/stack-item";
import { Swap } from "@erda/ui/components/swap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@erda/ui/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { useStableHeight } from "@erda/ui/hooks/use-stable-height";
import { listItem } from "@erda/ui/lib/motion";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
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
  const ready = loaded && data.data;
  const view = data.error ? "error" : ready ? "screen" : "loading";
  return (
    <div className="relative">
      <Swap id={view}>
        {data.error ? (
          <ErrorRow message={describeError(data.error)} onRetry={() => void data.refetch()} />
        ) : ready ? (
          <PotentialScreen data={ready} settings={settings} patch={patch} />
        ) : (
          <LoadingRow label="옵션표 불러오는 중…" />
        )}
      </Swap>
    </div>
  );
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
  const { kind, method, config, state, last } = session;
  const target = useMemo(() => targetOf(config, kind, method), [config, kind, method]);
  const rule = methodRule(target);
  const methods = methodsOf(kind);
  const pity = state ? pityOf(state, method) : 0;
  const usable =
    state !== null &&
    canUseMethod(target, state.current.grade) &&
    lineTables(data, target, state.current.grade) !== null;
  const canAuto = state !== null && usable && canAutoFrom(target, state.current.grade);
  const busy = session.auto || session.autoElsewhere;
  const animate = settings.effects && !reduced && !session.auto && last !== null;
  const [flipped, setFlipped] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<{ index: number; id: number; pending: unknown } | null>(null);
  const revealBurst =
    settings.effects && !reduced && revealed !== null && revealed.pending === state?.pending ? revealed : null;
  const burst = animate && last?.upgraded ? last.id : revealBurst ? -revealBurst.id : null;
  const cards = Math.max(1, state?.pending.length ?? 0);
  const gridRef = useStableHeight<HTMLDivElement>(`${kind}:${config.part}:${config.level}:${cards}`);
  const selectKind = (k: PotentialKind) => {
    setKindWanted(k);
    patch({ kind: k });
  };
  const selectMethod = (m: PotentialMethod) => patch({ methods: { ...settings.methods, [kind]: m } });
  const methodItems = methods.map((m) => ({ value: m, label: methodRule({ kind, method: m })?.label ?? m }));

  const apply = (d: ItemDraft) => {
    const start = {} as PotentialSettings["start"];
    for (const k of POTENTIAL_KINDS) {
      const t = { kind: k, part: d.part, level: d.level, soulStep: d.soulStep, method: "meso" } as const;
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
          {methods.length > 1 ? (
            <Select
              items={methodItems}
              value={method}
              onValueChange={(v) => {
                const m = methods.find((o) => o === v);
                if (m) selectMethod(m);
              }}
              disabled={busy || dialog === "auto"}
            >
              <SelectTrigger className="w-full" aria-label="재설정 방식">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methodItems.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {state ? (
            <>
              <AutoHeight>
                <div ref={gridRef} className="grid auto-rows-fr grid-cols-2 gap-2">
                  <RollCard
                    title="before"
                    roll={state.current}
                    selectLabel="BEFORE 유지"
                    onSelect={session.auto || state.pending.length === 0 ? undefined : () => session.choose("before")}
                  />
                  {Array.from({ length: cards }, (_, i) => {
                    const roll = state.pending[i] ?? null;
                    if (session.concealed.includes(i)) {
                      return (
                        <ConcealedCard
                          key={`concealed-${i}`}
                          animate={settings.effects && !reduced}
                          onReveal={() => {
                            setFlipped(i);
                            if (roll?.upgraded) {
                              setRevealed((r) => ({ index: i, id: (r?.id ?? 0) + 1, pending: state.pending }));
                            }
                            session.reveal(i);
                          }}
                        />
                      );
                    }
                    const flash = flipped === i && settings.effects && !reduced;
                    return (
                      <div key={i} className="relative flex min-w-0 *:flex-1">
                        <RollCard
                          title="after"
                          roll={roll}
                          revealId={last?.id}
                          animate={animate}
                          gradeUp={revealBurst ? revealBurst.index === i : burst !== null && !!roll?.upgraded}
                          selectLabel="AFTER 적용"
                          onSelect={session.auto || !roll ? undefined : () => session.choose(i)}
                        />
                        {flash ? <RevealFlash onDone={() => setFlipped(null)} /> : null}
                      </div>
                    );
                  })}
                </div>
              </AutoHeight>
              <div className="relative">
                <OddsRow
                  className={usable ? undefined : "invisible"}
                  odds={upgradeOdds(target, state.current.grade, pity, settings.miracle)}
                  topLabel={state.current.grade === "legendary" ? "최고 등급" : "큐브 최고 등급"}
                  pity={pity}
                  cost={rule?.meso ? formatMeso(BigInt(resetMeso(target, state.current.grade))) : "큐브 1개"}
                />
                {usable ? null : (
                  <p className="absolute inset-0 m-0 flex items-center text-[12px] text-muted-foreground">
                    {rule && !canUseMethod(target, state.current.grade)
                      ? `${rule.label}는 ${
                          rule.minGrade === rule.maxGrade
                            ? POTENTIAL_GRADE_LABELS[rule.minGrade]
                            : `${POTENTIAL_GRADE_LABELS[rule.minGrade]}~${POTENTIAL_GRADE_LABELS[rule.maxGrade]}`
                        } 장비에만 쓸 수 있어요.`
                      : "이 방식은 이 부위와 레벨에 공개된 옵션표가 없어요."}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="m-0 text-[12px] text-muted-foreground">이 부위와 레벨에는 공개된 옵션표가 없어요.</p>
          )}
          <ActionBar
            canReset={state !== null && usable && !session.autoElsewhere && !hasPendingUpgrade(state)}
            canAuto={canAuto}
            tripleBlocked={state !== null && !tripleAllowed(target, state.current.grade, pity)}
            auto={session.auto}
            onReset={session.reset}
            onStopAuto={session.stopAuto}
            onOpenAuto={() => setDialog("auto")}
            onRestart={() => session.restart(settings)}
          />
          <AnimatePresence initial={false}>
            {session.stoppedAtLimit ? (
              <m.div key="limit" {...listItem} className="-mt-3">
                <p className="m-0 pt-3 text-[12px] text-muted-foreground">
                  자동 재설정은 한 번에 {AUTO_LIMIT.toLocaleString()}회까지만 돌려요. 목표를 바꿔 보세요.
                </p>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </Module>
      <AnimatePresence mode="popLayout" initial={false}>
        {state ? (
          <StackItem key="ledger">
            <LedgerModule kind={kind} ledger={state.ledger} />
          </StackItem>
        ) : null}
        <StackItem key="settings">
          <SettingsModule
            item={settings.item}
            part={config.part}
            level={config.level}
            soulStep={config.soulStep}
            onEditItem={() => setDialog("item")}
            effects={settings.effects}
            onEffects={(effects) => patch({ effects })}
            miracle={settings.miracle}
            onMiracle={(miracle) => patch({ miracle })}
            onOpenInfo={() => setDialog("info")}
          />
        </StackItem>
      </AnimatePresence>
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
