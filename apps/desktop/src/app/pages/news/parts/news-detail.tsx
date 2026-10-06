import { describeError } from "@erda/api/errors";
import { clampLines, type NewsEntry } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Button } from "@erda/ui/components/ui/button";
import { ExternalLink } from "lucide-react";

import { useNoticeDetail } from "#/features/news/use-notice-detail.ts";
import { openExternal } from "#/lib/tauri.ts";

export function NewsDetail({ entry }: { entry: NewsEntry }) {
  const detail = useNoticeDetail(entry, true);
  const clamped = detail.text !== undefined ? clampLines(detail.text, 40) : null;
  return (
    <div className="mt-1.5 pl-[30px]">
      {detail.isLoading ? <LoadingRow label="본문 불러오는 중…" /> : null}
      {detail.error ? <ErrorRow message={describeError(detail.error)} onRetry={() => void detail.refetch()} /> : null}
      {clamped ? (
        <div className="animate-in text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90 duration-150 select-text fade-in">
          {clamped.text || "본문이 비어 있어요"}
          {clamped.truncated ? "\n…" : ""}
        </div>
      ) : null}
      <Button
        variant="ghost"
        size="xs"
        className="mt-1"
        onClick={() => void openExternal(entry.url)}
        disabled={!entry.url}
      >
        <ExternalLink />
        웹에서 열기
      </Button>
    </div>
  );
}
