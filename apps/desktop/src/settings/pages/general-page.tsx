import { hasApiKey, normalizeApiKey } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { Input } from "@erda/ui/components/ui/input";
import { Separator } from "@erda/ui/components/ui/separator";
import { toastManager } from "@erda/ui/lib/toast";
import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { exit } from "@tauri-apps/plugin-process";
import { useCallback, useEffect, useId, useState } from "react";

import { useSetting } from "#/features/settings/use-settings.ts";
import { errorMessage, runAction, useAction } from "#/lib/action.ts";
import { isCommitEnter } from "#/lib/keys.ts";
import { NEXON_APP_URL, openExternal } from "#/lib/tauri.ts";
import { ConfirmDialog } from "#/settings/confirm-dialog.tsx";
import { SettingNumber, SettingRow, SettingSwitch } from "#/settings/setting-row.tsx";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const readStats = () => Promise.all([invoke<number>("nexon_cache_size"), invoke<number>("nexon_calls_today")]);

function useNexonStats() {
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [callsToday, setCallsToday] = useState<number | null>(null);
  const [statsError, setStatsError] = useState(false);
  const applyStats = useCallback(
    (p: Promise<[number, number]>) =>
      p
        .then(([size, calls]) => {
          setCacheSize(size);
          setCallsToday(calls);
          setStatsError(false);
        })
        .catch((e) => {
          console.error("failed to read nexon stats", e);
          setStatsError(true);
        }),
    [],
  );
  const refreshStats = () => applyStats(readStats());
  return { cacheSize, callsToday, statsError, applyStats, refreshStats };
}

function useAutostart() {
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [autostartError, setAutostartError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    isEnabled()
      .then((on) => {
        if (!cancelled) setAutostart(on);
      })
      .catch((e) => {
        if (!cancelled) {
          setAutostart(false);
          setAutostartError(errorMessage(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const toggleAutostart = async (on: boolean) => {
    setAutostartError(null);
    setAutostart(on);
    try {
      if (on) await enable();
      else await disable();
    } catch (e) {
      setAutostartError(errorMessage(e));
      setAutostart(!on);
    }
  };
  return { autostart, autostartError, toggleAutostart };
}

function ApiKeyRow() {
  const id = useId();
  const [apiKey, setApiKey] = useSetting("settings.apiKey");
  const [keyDraft, setKeyDraft] = useState<string | null>(null);
  const keySave = useAction();
  const keyDirty = keyDraft !== null && normalizeApiKey(keyDraft) !== apiKey;
  const saveKey = async () => {
    if (keyDraft === null || !keyDirty) return;
    const next = normalizeApiKey(keyDraft);
    const ok = await keySave.run(async () => {
      await setApiKey(next);
      return true;
    }, "API 키를 저장하지 못했어요");
    if (ok) {
      setKeyDraft(null);
      toastManager.add({ type: "success", title: next ? "API 키를 저장했어요" : "API 키를 지웠어요" });
    }
  };
  return (
    <SettingRow
      label="넥슨 Open API 키"
      htmlFor={`${id}-key`}
      description={
        <>
          {hasApiKey(apiKey) ? "입력됨 · " : "미입력 · "}
          <button type="button" className="underline underline-offset-2" onClick={() => openExternal(NEXON_APP_URL)}>
            openapi.nexon.com에서 발급
          </button>
        </>
      }
    >
      <div className="flex shrink-0 items-center gap-2">
        <Input
          id={`${id}-key`}
          type="password"
          className="w-64"
          value={keyDraft ?? apiKey}
          onChange={(e) => setKeyDraft(e.target.value)}
          onKeyDown={(e) => {
            if (isCommitEnter(e)) {
              e.preventDefault();
              void saveKey();
            }
          }}
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
        />
        <Button variant="outline" size="sm" disabled={!keyDirty || keySave.pending} onClick={saveKey}>
          저장
        </Button>
      </div>
    </SettingRow>
  );
}

export function GeneralPage() {
  const id = useId();
  const [budget, setBudget] = useSetting("settings.historySyncDailyBudget");
  const { autostart, autostartError, toggleAutostart } = useAutostart();
  const { cacheSize, callsToday, statsError, applyStats, refreshStats } = useNexonStats();
  const cacheClear = useAction();
  const [quitOpen, setQuitOpen] = useState(false);
  useEffect(() => {
    void applyStats(readStats());
  }, [applyStats]);
  const clearCache = async () => {
    await cacheClear.run(() => invoke("nexon_cache_clear"), "캐시를 비우지 못했어요");
    await refreshStats();
  };
  const cacheText = statsError ? "크기를 읽지 못했어요" : cacheSize === null ? "…" : formatBytes(cacheSize);
  return (
    <div>
      <ApiKeyRow />
      <Separator />
      <SettingRow
        label="로그인 시 자동 실행"
        htmlFor={`${id}-autostart`}
        labelId={`${id}-autostart-label`}
        description={autostartError}
        descriptionClassName="text-destructive"
      >
        <SettingSwitch
          id={`${id}-autostart`}
          labelId={`${id}-autostart-label`}
          checked={autostart}
          onCheckedChange={(v) => toggleAutostart(v)}
        />
      </SettingRow>
      <Separator />
      <SettingRow
        label="응답 캐시"
        description={`${cacheText} · 캐릭터 10분, 공지 5분, 랭킹 1시간, 스케줄러 1분 동안 재사용해요`}
      >
        <Button variant="outline" size="sm" disabled={cacheClear.pending} onClick={clearCache}>
          캐시 비우기
        </Button>
      </SettingRow>
      <Separator />
      <SettingRow
        label="히스토리 동기화 일일 호출 상한"
        htmlFor={`${id}-budget`}
        description={`오늘 실제 호출 ${callsToday === null ? "—" : `${callsToday}회`} · 2년치 전체 동기화는 종류당 700회 이상이고, 넥슨 키 한도는 하루 약 1,000회예요`}
      >
        <SettingNumber
          id={`${id}-budget`}
          value={budget}
          min={0}
          max={5000}
          step={50}
          inputClassName="w-16"
          unit="회"
          onCommit={(v) => void runAction(() => setBudget(v), "호출 상한을 저장하지 못했어요")}
        />
      </SettingRow>
      <Separator />
      <SettingRow label="Erda 종료">
        <Button variant="outline" size="sm" onClick={() => setQuitOpen(true)}>
          종료
        </Button>
      </SettingRow>
      <ConfirmDialog
        open={quitOpen}
        onOpenChange={setQuitOpen}
        title="Erda를 종료할까요?"
        description="실행 중인 타이머 알림이 멈춰요."
        confirmLabel="종료"
        failTitle="종료하지 못했어요"
        onConfirm={() => exit(0)}
      />
    </div>
  );
}
