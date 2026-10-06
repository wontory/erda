import { TIMER_PRESETS, describeGroup, formatRemaining, type TimerGroup } from "@erda/core";
import { TimerIcon } from "@erda/ui/components/timer-icon";
import { Button } from "@erda/ui/components/ui/button";
import { Separator } from "@erda/ui/components/ui/separator";
import { invoke } from "@tauri-apps/api/core";
import { ArrowDown, ArrowUp, Volume2 } from "lucide-react";
import { useId, useState } from "react";

import { useSetting } from "#/features/settings/use-settings.ts";
import { presetColor } from "#/features/timers/commands.ts";
import { useTimerGroups } from "#/features/timers/use-timer-groups.ts";
import { runAction } from "#/lib/action.ts";
import { ConfirmDialog } from "#/settings/confirm-dialog.tsx";
import { SettingNumber, SettingRow, SettingSwitch } from "#/settings/setting-row.tsx";

import { GroupEditorDialog } from "./group-editor-dialog.tsx";
import { newGroup } from "./group-editor.ts";

type SwitchSetting = "settings.timerTickSound" | "settings.timerSound" | "settings.timerDucking";

const MOVE_FAILED = "순서를 바꾸지 못했어요";

function SwitchRow({
  setting,
  label,
  description,
  failTitle,
  preview,
}: {
  setting: SwitchSetting;
  label: string;
  description: string;
  failTitle: string;
  preview?: "tick" | "finish";
}) {
  const id = useId();
  const [on, setOn, loaded] = useSetting(setting);
  const toggle = (
    <SettingSwitch
      id={id}
      labelId={`${id}-label`}
      checked={loaded ? on : null}
      onCheckedChange={(v) => void runAction(() => setOn(v), failTitle)}
    />
  );
  return (
    <SettingRow label={label} htmlFor={id} labelId={`${id}-label`} description={description}>
      {preview ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${label} 미리 듣기`}
            title="미리 듣기"
            onClick={() =>
              void runAction(() => invoke("sound_preview", { sound: preview }), "소리를 재생하지 못했어요")
            }
          >
            <Volume2 />
          </Button>
          {toggle}
        </div>
      ) : (
        toggle
      )}
    </SettingRow>
  );
}

function GroupRow({
  group,
  first,
  last,
  onMove,
  onEdit,
  onDelete,
}: {
  group: TimerGroup;
  first: boolean;
  last: boolean;
  onMove: (delta: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="truncate">{group.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">{describeGroup(group)}</div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`${group.name} 위로`}
        focusableWhenDisabled
        className="aria-disabled:opacity-50"
        disabled={first}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`${group.name} 아래로`}
        focusableWhenDisabled
        className="aria-disabled:opacity-50"
        disabled={last}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
      <Button variant="outline" size="xs" aria-label={`${group.name} 편집`} onClick={onEdit}>
        편집
      </Button>
      <Button variant="ghost" size="xs" aria-label={`${group.name} 삭제`} onClick={onDelete}>
        삭제
      </Button>
    </div>
  );
}

function PresetList() {
  return (
    <div className="grid grid-cols-2 gap-x-6">
      {TIMER_PRESETS.map((p) => (
        <div key={p.id} className="flex items-center gap-2 py-1 text-[12px]">
          <TimerIcon name={p.icon} color={presetColor(p.category)} size={14} />
          <span className="min-w-0 flex-1 truncate">{p.name}</span>
          <span className="text-muted-foreground tabular-nums">{formatRemaining(p.seconds)}</span>
        </div>
      ))}
    </div>
  );
}

export function TimerPage() {
  const id = useId();
  const [overlay, setOverlay] = useSetting("settings.timerOverlaySeconds");
  const { groups, loaded, save, remove, move } = useTimerGroups();
  const [editing, setEditing] = useState<TimerGroup | null>(null);
  const [deleting, setDeleting] = useState<TimerGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const askDelete = (g: TimerGroup) => {
    setDeleting(g);
    setDeleteOpen(true);
  };
  return (
    <div>
      <SettingRow
        label="HUD 카운트다운"
        htmlFor={`${id}-overlay`}
        description={overlay === 0 ? "끔" : `${overlay}초 전부터`}
      >
        <SettingNumber
          id={`${id}-overlay`}
          value={overlay}
          min={0}
          max={60}
          unit="초"
          onCommit={(v) => void runAction(() => setOverlay(v), "HUD 설정을 저장하지 못했어요")}
        />
      </SettingRow>
      <Separator />
      <SwitchRow
        setting="settings.timerTickSound"
        preview="tick"
        label="카운트다운 소리"
        description="HUD 카운트다운 동안 초마다 작은 차임이 울려요"
        failTitle="소리 설정을 저장하지 못했어요"
      />
      <Separator />
      <SwitchRow
        setting="settings.timerSound"
        preview="finish"
        label="종료 소리"
        description="타이머가 끝나면 윈드차임이 울려요"
        failTitle="소리 설정을 저장하지 못했어요"
      />
      <Separator />
      <SwitchRow
        setting="settings.timerDucking"
        label="다른 앱 소리 줄이기"
        description="효과음이 나는 동안 음악·영상 소리를 배경음처럼 잔잔하게 줄여요. macOS는 처음 한 번 시스템 오디오 녹음 권한을 물어요"
        failTitle="설정을 저장하지 못했어요"
      />
      <Separator />
      <SettingRow
        label="타이머 그룹"
        description={loaded ? (groups.length === 0 ? "없음" : `${groups.length}개`) : undefined}
      >
        <Button variant="outline" size="sm" onClick={() => setEditing(newGroup())}>
          새 그룹
        </Button>
      </SettingRow>
      <div className="flex flex-col gap-1 pb-2.5">
        {loaded &&
          groups.map((g, i) => (
            <GroupRow
              key={g.id}
              group={g}
              first={i === 0}
              last={i === groups.length - 1}
              onMove={(delta) => runAction(() => move(g.id, delta), MOVE_FAILED)}
              onEdit={() => setEditing(g)}
              onDelete={() => askDelete(g)}
            />
          ))}
      </div>
      <Separator />
      <SettingRow label="프리셋" description="프리셋은 바꿀 수 없어요. 조합은 그룹으로 만들어 주세요">
        <span className="text-[11px] text-muted-foreground">{TIMER_PRESETS.length}개</span>
      </SettingRow>
      <PresetList />
      <GroupEditorDialog
        group={editing}
        onClose={() => setEditing(null)}
        onSave={async (g) => {
          await save(g);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onOpenChangeComplete={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`‘${deleting?.name ?? ""}’ 그룹 삭제`}
        description="이 그룹을 지워요. 되돌릴 수 없어요."
        confirmLabel="삭제"
        failTitle="그룹을 삭제하지 못했어요"
        onConfirm={async () => {
          if (deleting) await remove(deleting.id);
        }}
      />
    </div>
  );
}
