import { normalizeApiKey } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import { Input } from "@erda/ui/components/ui/input";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useSetting } from "#/features/settings/use-settings.ts";
import { useAction } from "#/lib/action.ts";
import { NEXON_APP_URL, openExternal } from "#/lib/tauri.ts";

export function OnboardingModule() {
  const [, setApiKey] = useSetting("settings.apiKey");
  const [draft, setDraft] = useState("");
  const save = useAction();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <>
      <Module title="Erda 시작하기">
        <p className="text-[12px] text-muted-foreground">
          넥슨 Open API 키 하나면 돼요. 키는 이 컴퓨터에만 저장되고, 공개된 캐릭터 데이터만 조회해요.
        </p>
      </Module>
      <Module title="1. 키 발급">
        <p className="mb-2 text-[12px] text-muted-foreground">
          넥슨 Open API 사이트에 로그인해 애플리케이션을 등록하면 키가 바로 나와요.
        </p>
        <Button variant="outline" size="sm" onClick={() => void openExternal(NEXON_APP_URL)}>
          <ExternalLink /> openapi.nexon.com 열기
        </Button>
      </Module>
      <Module title="2. 키 붙여넣기">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const key = normalizeApiKey(draft);
            void save.run(() => setApiKey(key), "API 키를 저장하지 못했어요");
          }}
        >
          <Input
            ref={inputRef}
            type="password"
            placeholder="API 키"
            aria-label="넥슨 Open API 키"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit" disabled={save.pending || normalizeApiKey(draft).length === 0}>
            저장
          </Button>
        </form>
      </Module>
      <Module title="3. 끝">
        <p className="text-[12px] text-muted-foreground">
          키를 넣으면 내 계정 캐릭터를 불러와 레벨이 가장 높은 캐릭터를 본캐로 보여줘요. 본캐는 설정 › 캐릭터에서 바꿀
          수 있어요.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          데이터는 게임 플레이 후 평균 15분 뒤에 반영돼요. 설정은 오른쪽 위 톱니바퀴 버튼으로 열 수 있어요.
        </p>
      </Module>
    </>
  );
}
