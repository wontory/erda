import { DurationField } from "@erda/ui/components/duration-field";
import { Button } from "@erda/ui/components/ui/button";
import { Input } from "@erda/ui/components/ui/input";
import { Switch } from "@erda/ui/components/ui/switch";
import { useId, useState } from "react";

import { useAction } from "#/lib/action.ts";
import { isCommitEnter } from "#/lib/keys.ts";

type StartCustom = (name: string, seconds: number, repeats: boolean) => Promise<unknown>;

export function CustomForm({ onStart }: { onStart: StartCustom }) {
  const [name, setName] = useState("");
  const repeatId = useId();
  const [seconds, setSeconds] = useState(600);
  const [repeats, setRepeats] = useState(false);
  const { run, pending } = useAction();
  const start = async () => {
    const started = await run(() => onStart(name, seconds, repeats), "타이머를 시작하지 못했어요");
    if (started !== undefined) setName("");
  };
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void start();
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="사용자 타이머"
        aria-label="타이머 이름"
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isCommitEnter(e)) e.preventDefault();
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <DurationField label="타이머 시간" value={seconds} min={1} max={240 * 60} onChange={setSeconds} />
        <label htmlFor={repeatId} className="flex items-center gap-2 text-[12px]">
          <span>반복</span>
          <Switch id={repeatId} size="sm" checked={repeats} onCheckedChange={(on) => setRepeats(on)} />
        </label>
        <Button type="submit" disabled={pending}>
          시작
        </Button>
      </div>
    </form>
  );
}
