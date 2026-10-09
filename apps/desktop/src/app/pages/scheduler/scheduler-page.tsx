import { CYCLES, CYCLE_META, bossById, bossesOf, type BossCycle, type BossEntry, type BossRow } from "@erda/core";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { StackItem } from "@erda/ui/components/stack-item";
import { Button } from "@erda/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { Check, Crown, Pencil } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { BOSS_LIST_LOADING_HEIGHT } from "#/app/pages/scheduler/parts/boss-row-view.tsx";
import { BossSummaryModule } from "#/app/pages/scheduler/parts/boss-summary-module.tsx";
import { EditList } from "#/app/pages/scheduler/parts/edit-list.tsx";
import { ManualList } from "#/app/pages/scheduler/parts/manual-list.tsx";
import { QuestModule } from "#/app/pages/scheduler/parts/quest-module.tsx";
import { SchedulerSection } from "#/app/pages/scheduler/parts/scheduler-section.tsx";
import { SettingsModule } from "#/app/pages/scheduler/parts/settings-module.tsx";
import { useBossView } from "#/features/boss/use-boss-view.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

function EditToggle({ editing, disabled, onToggle }: { editing: boolean; disabled: boolean; onToggle: () => void }) {
  const label = editing ? "편집 끝내기" : "편집";
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={label} disabled={disabled} onClick={onToggle}>
      {editing ? <Check /> : <Pencil />}
    </Button>
  );
}

function CycleTabs({ value, onChange }: { value: BossCycle; onChange: (cycle: BossCycle) => void }) {
  return (
    <Tabs value={value} onValueChange={(c) => onChange(c as BossCycle)}>
      <TabsList className="w-full">
        {CYCLES.map((c) => (
          <TabsTrigger key={c} value={c}>
            {CYCLE_META[c].title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

const catalogEntries = (rows: BossRow[]): BossEntry[] =>
  rows.flatMap((r) => {
    const entry = r.catalogId ? bossById(r.catalogId) : undefined;
    return entry ? [entry] : [];
  });

export function SchedulerPage() {
  const { pop } = useNav();
  const [cycle, setCycle] = useState<BossCycle>("weekly");
  const view = useBossView(cycle);
  const [editingFor, setEditingFor] = useState<typeof view.mode | null>(null);
  const main = useMainCharacter();
  const { boss } = view;
  const [lastMode, setLastMode] = useState(view.mode);
  if (lastMode !== view.mode) {
    setLastMode(view.mode);
    setEditingFor(null);
  }
  const scheduler = view.mode === "scheduler";
  const editable = !scheduler || view.status === "ready";
  const editing = editable && editingFor === view.mode;
  const setEditing = (on: boolean) => setEditingFor(on ? view.mode : null);
  const save = (fn: () => Promise<unknown>) => void runAction(fn, "보스 기록을 저장하지 못했어요");
  const refresh = () => void runAction(() => view.refresh(), "스케줄러를 갱신하지 못했어요");
  const changeUseScheduler = (on: boolean) => {
    setEditing(false);
    void runAction(() => view.setUseScheduler(on), "설정을 저장하지 못했어요");
  };
  const editToggle = (
    <EditToggle editing={editing} disabled={view.resolving || !editable} onToggle={() => setEditing(!editing)} />
  );
  const trailing = (
    <>
      {scheduler ? <RefreshButton onClick={refresh} loading={view.refreshing} /> : null}
      {editToggle}
    </>
  );
  const onParty = (id: string, n: number) => save(() => boss.setParty(id, n));
  const onPrice = (id: string, n: number) => save(() => boss.setPrice(id, n));
  return (
    <>
      <ScreenHeader
        title="스케줄러"
        subtitle={main.name ? `본캐: ${main.name}` : undefined}
        onBack={pop}
        trailing={trailing}
        onSettings={() => void openSettingsAction()}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <StackItem key="tabs">
            <CycleTabs value={cycle} onChange={setCycle} />
          </StackItem>
          <StackItem key="summary">
            <BossSummaryModule view={view} cycle={cycle} now={view.now} />
          </StackItem>
          {view.resolving ? (
            <StackItem key="resolving">
              <Module
                title={view.schedulerSettingLoaded && view.useScheduler ? "등록한 보스" : "보스"}
                titleClassName={view.schedulerSettingLoaded ? undefined : "invisible"}
                icon={Crown}
              >
                <LoadingRow minHeight={BOSS_LIST_LOADING_HEIGHT} />
              </Module>
            </StackItem>
          ) : scheduler && editing ? (
            <StackItem key="edit">
              <EditList
                entries={catalogEntries(view.rows)}
                state={boss.state}
                emptyMessage="이 주기에 등록한 보스 중 가격표에 있는 보스가 없어요"
                onParty={onParty}
                onPrice={onPrice}
              />
            </StackItem>
          ) : scheduler ? (
            [
              <StackItem key="scheduler">
                <SchedulerSection
                  status={view.status}
                  errorMessage={view.errorMessage}
                  staleError={view.staleError}
                  rows={view.rows}
                  unregistered={view.unregistered}
                  onRetry={refresh}
                />
              </StackItem>,
              <StackItem key="quest">
                <QuestModule cycle={cycle} items={view.homework} />
              </StackItem>,
            ]
          ) : editing ? (
            <StackItem key="edit">
              <EditList
                entries={bossesOf(cycle)}
                state={boss.state}
                onToggleSelected={(id) => save(() => boss.toggleSelected(id))}
                onParty={onParty}
                onPrice={onPrice}
              />
            </StackItem>
          ) : (
            <StackItem key="manual">
              <ManualList
                rows={view.rows}
                loading={view.status === "loading"}
                onToggle={(id) => save(() => boss.toggleClear(id))}
                onEdit={() => setEditing(true)}
              />
            </StackItem>
          )}
          {view.schedulerAvailable && !view.resolving ? (
            <StackItem key="settings">
              <SettingsModule useScheduler={view.useScheduler} onChange={changeUseScheduler} />
            </StackItem>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
