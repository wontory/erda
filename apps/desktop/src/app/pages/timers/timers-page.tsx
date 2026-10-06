import { Module } from "@erda/ui/components/module";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { Play } from "lucide-react";
import { useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { CompletedModule } from "#/app/pages/timers/parts/completed-module.tsx";
import { CustomForm } from "#/app/pages/timers/parts/custom-form.tsx";
import { GroupList } from "#/app/pages/timers/parts/group-list.tsx";
import { PresetGrid } from "#/app/pages/timers/parts/preset-grid.tsx";
import { RunningModule } from "#/app/pages/timers/parts/running-module.tsx";
import type { StartMode } from "#/features/timers/types.ts";
import { useStartMode } from "#/features/timers/use-start-mode.ts";
import { useStartTimers } from "#/features/timers/use-start-timers.ts";
import { useTimerGroups } from "#/features/timers/use-timer-groups.ts";
import { runAction, useAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

const MODES: StartMode[] = ["프리셋", "그룹", "직접"];
const START_FAILED = "타이머를 시작하지 못했어요";

export function TimersPage() {
  const { pop } = useNav();
  const { groups, loaded: groupsLoaded } = useTimerGroups();
  const [mode, setMode] = useStartMode();
  const [buffRepeat, setBuffRepeat] = useState(false);
  const start = useStartTimers();
  const { run } = useAction();
  const changeMode = (m: StartMode) => void runAction(() => setMode(m), "시작 방식을 저장하지 못했어요");
  return (
    <>
      <ScreenHeader title="타이머" onBack={pop} onSettings={() => void openSettingsAction()} />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <RunningModule />
        <CompletedModule />
        <Module title="시작하기" icon={Play}>
          <Tabs value={mode} onValueChange={(m) => changeMode(m as StartMode)} className="gap-2.5">
            <TabsList className="w-full">
              {MODES.map((m) => (
                <TabsTrigger key={m} value={m}>
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="프리셋">
              <PresetGrid
                buffRepeat={buffRepeat}
                onBuffRepeat={setBuffRepeat}
                onStart={(p) => void run(() => start.startPreset(p, buffRepeat), START_FAILED)}
              />
            </TabsContent>
            <TabsContent value="그룹">
              <GroupList
                groups={groups}
                loaded={groupsLoaded}
                onStart={(g) => void run(() => start.startGroup(g), START_FAILED)}
              />
            </TabsContent>
            <TabsContent value="직접">
              <CustomForm onStart={start.startCustom} />
            </TabsContent>
          </Tabs>
        </Module>
      </div>
    </>
  );
}
