import { PRICE_BASE_DATE } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { Field, FieldTitle } from "@erda/ui/components/ui/field";
import { fade } from "@erda/ui/lib/motion";
import { cn } from "@erda/ui/lib/utils";
import { getVersion } from "@tauri-apps/api/app";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { useAppUpdate, type UpdateState } from "#/features/update/use-app-update.ts";
import { MAPLESTORY_URL, NEXON_OPEN_API_URL, openExternal } from "#/lib/tauri.ts";
import { LABEL, ROW } from "#/settings/field.ts";

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Field orientation="horizontal" className={ROW}>
      <FieldTitle className={LABEL}>{label}</FieldTitle>
      {children}
    </Field>
  );
}

function updateStatus(state: UpdateState): string | null {
  switch (state.status) {
    case "checking":
      return "확인 중…";
    case "latest":
      return "최신 버전이에요";
    case "available":
      return `새 버전 ${state.update.version}`;
    case "installing":
      return state.progress === null ? "설치 중…" : `설치 중 ${Math.round(state.progress * 100)}%`;
    case "error":
      return state.update ? "업데이트하지 못했어요" : "확인하지 못했어요";
    default:
      return null;
  }
}

function UpdateRow() {
  const { state, check, install } = useAppUpdate();
  const status = updateStatus(state);
  const update = "update" in state ? state.update : null;
  const busy = state.status === "checking" || state.status === "installing";
  return (
    <InfoRow label="업데이트">
      <div className="flex items-center gap-2">
        <AnimatePresence initial={false}>
          {status ? (
            <m.span
              key="status"
              {...fade}
              className={cn("tabular-nums", state.status === "error" ? "text-destructive" : "text-muted-foreground")}
            >
              {status}
            </m.span>
          ) : null}
        </AnimatePresence>
        {update ? (
          <Button disabled={busy} onClick={() => void install(update)}>
            업데이트 후 재시작
          </Button>
        ) : (
          <Button variant="outline" disabled={busy} onClick={() => void check()}>
            업데이트 확인
          </Button>
        )}
      </div>
    </InfoRow>
  );
}

export function AboutPage() {
  const [version, setVersion] = useState("");
  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch((e) => console.error("failed to read version", e));
  }, []);
  return (
    <div>
      <InfoRow label="버전">
        <span className="tabular-nums">{version}</span>
      </InfoRow>
      <UpdateRow />
      <InfoRow label="보스 결정석 가격 기준일">
        <span className="tabular-nums">{PRICE_BASE_DATE}</span>
      </InfoRow>
      <InfoRow label="링크">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openExternal(NEXON_OPEN_API_URL)}>
            Nexon Open API
          </Button>
          <Button variant="outline" onClick={() => openExternal(MAPLESTORY_URL)}>
            maplestory.nexon.com
          </Button>
        </div>
      </InfoRow>
      <p className="pt-4 text-[11px] text-muted-foreground">
        Data based on NEXON Open API. 메이플스토리의 모든 저작권은 NEXON에 있습니다.
      </p>
    </div>
  );
}
