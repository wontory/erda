import { TIMER_PRESETS, customEntry, entryFromPreset, type TimerGroup, type TimerGroupEntry } from "@erda/core";
import { DurationField } from "@erda/ui/components/duration-field";
import { Button } from "@erda/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@erda/ui/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@erda/ui/components/ui/dropdown-menu";
import { Input } from "@erda/ui/components/ui/input";
import { Toggle } from "@erda/ui/components/ui/toggle";
import { listItem } from "@erda/ui/lib/motion";
import { ArrowDown, ArrowUp, Repeat, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState, type KeyboardEvent } from "react";

import { moveById } from "#/features/timers/groups-ops.ts";
import { errorMessage } from "#/lib/action.ts";
import { isCommitEnter } from "#/lib/keys.ts";

import { addEntry, groupValid, makeEntryId, patchEntry, renameEntry, removeEntry } from "./group-editor.ts";

type GroupHandlers = { onClose: () => void; onSave: (g: TimerGroup) => Promise<void> };

const guardIme = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" && !isCommitEnter(e)) e.preventDefault();
};

export function GroupEditorDialog({ group, onClose, onSave }: GroupHandlers & { group: TimerGroup | null }) {
  const [last, setLast] = useState(group);
  if (group !== null && group !== last) setLast(group);
  const shown = group ?? last;
  const [wasOpen, setWasOpen] = useState(group !== null);
  const [openSeq, setOpenSeq] = useState(0);
  if ((group !== null) !== wasOpen) {
    setWasOpen(group !== null);
    if (group !== null) setOpenSeq((n) => n + 1);
  }
  return (
    <Dialog
      open={group !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onOpenChangeComplete={(open) => {
        if (!open) setLast(null);
      }}
    >
      {shown ? <Editor key={`${shown.id}-${openSeq}`} initial={shown} onClose={onClose} onSave={onSave} /> : null}
    </Dialog>
  );
}

function EntryRow({
  entry: e,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  entry: TimerGroupEntry;
  first: boolean;
  last: boolean;
  onChange: (update: (g: TimerGroup) => TimerGroup) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const label = e.name || "타이머";
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <Input
        className="min-w-0 flex-1"
        value={e.name}
        aria-label={`${label} 이름`}
        autoComplete="off"
        spellCheck={false}
        onKeyDown={guardIme}
        onChange={(ev) => onChange((g) => renameEntry(g, e.id, ev.target.value))}
      />
      <DurationField
        label={`${label} 시간`}
        value={e.seconds}
        min={1}
        max={14400}
        onChange={(s) => onChange((g) => patchEntry(g, e.id, { seconds: s }))}
      />
      <Toggle
        size="sm"
        pressed={e.repeats}
        onPressedChange={(on) => onChange((g) => patchEntry(g, e.id, { repeats: on }))}
        aria-label={`${label} 반복`}
        title="반복"
      >
        <Repeat />
      </Toggle>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`${label} 위로`}
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
        aria-label={`${label} 아래로`}
        focusableWhenDisabled
        className="aria-disabled:opacity-50"
        disabled={last}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
      <Button variant="ghost" size="icon-xs" aria-label={`${label} 제거`} onClick={onRemove}>
        <X />
      </Button>
    </div>
  );
}

function AddTimerMenu({ onAdd }: { onAdd: (entry: TimerGroupEntry) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
        타이머 추가
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {TIMER_PRESETS.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => onAdd(entryFromPreset(p, makeEntryId))}>
            {p.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAdd(customEntry(makeEntryId))}>직접 만들기 (10분)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Editor({ initial, onClose, onSave }: GroupHandlers & { initial: TimerGroup }) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entries = draft.entries;
  const submit = async () => {
    if (!groupValid(draft) || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...draft, name: draft.name.trim() });
    } catch (e) {
      console.error("failed to save timer group", e);
      setError(`저장하지 못했어요. ${errorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <DialogContent className="flex h-[440px] w-[520px] max-w-[520px] flex-col">
      <form
        className="flex min-h-0 flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <DialogHeader>
          <DialogTitle>{initial.name ? "그룹 편집" : "새 그룹"}</DialogTitle>
          <DialogDescription>타이머를 묶어 한 번에 시작해요</DialogDescription>
        </DialogHeader>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="예: 사냥 시작"
          aria-label="그룹 이름"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={guardIme}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {entries.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-muted-foreground">
              아래 "타이머 추가"로 항목을 넣어 주세요
            </div>
          ) : null}
          <AnimatePresence initial={false}>
            {entries.map((e, i) => (
              <m.div key={e.id} {...listItem} className="overflow-hidden">
                <EntryRow
                  entry={e}
                  first={i === 0}
                  last={i === entries.length - 1}
                  onChange={(update) => setDraft(update(draft))}
                  onMove={(delta) => setDraft({ ...draft, entries: moveById(entries, e.id, delta) })}
                  onRemove={() => setDraft(removeEntry(draft, e.id))}
                />
              </m.div>
            ))}
          </AnimatePresence>
        </div>
        {error ? (
          <p role="alert" className="text-[12px] text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter className="sm:justify-between">
          <AddTimerMenu onAdd={(entry) => setDraft(addEntry(draft, entry))} />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={!groupValid(draft) || saving}>
              저장
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
