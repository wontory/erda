import { Module } from "@erda/ui/components/module";
import { Switch } from "@erda/ui/components/ui/switch";
import { Settings2 } from "lucide-react";
import { useId } from "react";

export function SettingsModule({ useScheduler, onChange }: { useScheduler: boolean; onChange: (v: boolean) => void }) {
  const switchId = useId();
  return (
    <Module title="설정" icon={Settings2}>
      <label htmlFor={switchId} className="flex items-center justify-between gap-3 px-1">
        <span className="min-w-0">
          <span className="block">인게임 스케줄러 연동</span>
          <span className="block text-[11px] text-muted-foreground">
            본캐가 게임에 등록한 보스와 퀘스트를 가져와요. 넥슨 데이터는 평균 15분 뒤에 반영돼요.
          </span>
        </span>
        <Switch id={switchId} checked={useScheduler} onCheckedChange={(on) => onChange(on)} />
      </label>
    </Module>
  );
}
