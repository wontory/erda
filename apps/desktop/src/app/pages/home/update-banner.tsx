import { Button } from "@erda/ui/components/ui/button";
import { Download } from "lucide-react";

import { useAppUpdate } from "#/features/update/use-app-update.ts";

export function UpdateBanner() {
  const { state, install } = useAppUpdate({ auto: true });
  const update = "update" in state ? state.update : null;
  if (!update) return null;
  const installing = state.status === "installing";
  const progress = installing && state.progress !== null ? ` ${Math.round(state.progress * 100)}%` : "";
  return (
    <div className="flex animate-in items-center gap-2.5 rounded-xl bg-primary/10 px-3 py-2 text-[12px] duration-200 fade-in">
      <Download className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        {state.status === "error" ? "업데이트하지 못했어요" : `새 버전 ${update.version}이 나왔어요`}
      </span>
      <Button disabled={installing} onClick={() => void install(update)}>
        {installing ? `설치 중${progress}` : state.status === "error" ? "다시 시도" : "업데이트"}
      </Button>
    </div>
  );
}
