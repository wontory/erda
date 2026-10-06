import { PRICE_BASE_DATE } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import { Field, FieldTitle } from "@erda/ui/components/ui/field";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState, type ReactNode } from "react";

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
      <InfoRow label="보스 결정석 가격 기준일">
        <span className="tabular-nums">{PRICE_BASE_DATE}</span>
      </InfoRow>
      <InfoRow label="링크">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openExternal(NEXON_OPEN_API_URL)}>
            Nexon Open API
          </Button>
          <Button variant="outline" size="sm" onClick={() => openExternal(MAPLESTORY_URL)}>
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
