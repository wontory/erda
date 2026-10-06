import { CYCLES, CYCLE_META, type BossCycle } from "@erda/core";
import { RefreshButton } from "@erda/ui/components/refresh-button";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { Check, Pencil } from "lucide-react";
import { useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { BossSummaryModule } from "#/app/pages/boss/parts/boss-summary-module.tsx";
import { EditList } from "#/app/pages/boss/parts/edit-list.tsx";
import { HomeworkModule } from "#/app/pages/boss/parts/homework-module.tsx";
import { ManualList } from "#/app/pages/boss/parts/manual-list.tsx";
import { SchedulerSection } from "#/app/pages/boss/parts/scheduler-section.tsx";
import { SettingsModule } from "#/app/pages/boss/parts/settings-module.tsx";
import { useBossView } from "#/features/boss/use-boss-view.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

function EditToggle({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  const label = editing ? "편집 끝내기" : "편집";
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={onToggle}>
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

export function BossPage() {
  const { pop } = useNav();
  const [cycle, setCycle] = useState<BossCycle>("weekly");
  const [editingFor, setEditingFor] = useState<"manual" | null>(null);
  const view = useBossView(cycle);
  const main = useMainCharacter();
  const { boss } = view;
  const [lastMode, setLastMode] = useState(view.mode);
  if (lastMode !== view.mode) {
    setLastMode(view.mode);
    setEditingFor(null);
  }
  const scheduler = view.mode === "scheduler";
  const editing = editingFor === view.mode;
  const setEditing = (on: boolean) => setEditingFor(on ? "manual" : null);
  const save = (fn: () => Promise<unknown>) => void runAction(fn, "보스 기록을 저장하지 못했어요");
  const refresh = () => void runAction(() => view.refresh(), "스케줄러를 갱신하지 못했어요");
  const changeUseScheduler = (on: boolean) => {
    setEditing(false);
    void runAction(() => view.setUseScheduler(on), "설정을 저장하지 못했어요");
  };
  const trailing = scheduler ? (
    <RefreshButton onClick={refresh} loading={view.refreshing} />
  ) : (
    <EditToggle editing={editing} onToggle={() => setEditing(!editing)} />
  );
  return (
    <>
      <ScreenHeader
        title="보스"
        subtitle={main.name ? `본캐: ${main.name}` : undefined}
        onBack={pop}
        trailing={trailing}
        onSettings={() => void openSettingsAction()}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <CycleTabs value={cycle} onChange={setCycle} />
        <BossSummaryModule view={view} cycle={cycle} now={view.now} />
        {scheduler ? (
          <>
            <SchedulerSection
              status={view.status}
              errorMessage={view.errorMessage}
              staleError={view.staleError}
              rows={view.rows}
              unregistered={view.unregistered}
              onRetry={refresh}
            />
            <HomeworkModule cycle={cycle} items={view.homework} />
          </>
        ) : editing ? (
          <EditList
            cycle={cycle}
            state={boss.state}
            onToggleSelected={(id) => save(() => boss.toggleSelected(id))}
            onParty={(id, n) => save(() => boss.setParty(id, n))}
            onPrice={(id, n) => save(() => boss.setPrice(id, n))}
          />
        ) : (
          <ManualList
            rows={view.rows}
            loading={view.status === "loading"}
            onToggle={(id) => save(() => boss.toggleClear(id))}
            onEdit={() => setEditing(true)}
          />
        )}
        {view.schedulerAvailable ? (
          <SettingsModule useScheduler={view.useScheduler} onChange={changeUseScheduler} />
        ) : null}
      </div>
    </>
  );
}
