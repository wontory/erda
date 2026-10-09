import { describeError } from "@erda/api/errors";
import type { NewsEntry } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Swap } from "@erda/ui/components/swap";
import { Button } from "@erda/ui/components/ui/button";
import { ExternalLink } from "lucide-react";

import { useNoticeDetail } from "#/features/news/use-notice-detail.ts";
import { openExternal } from "#/lib/tauri.ts";

export function NewsDetail({ entry }: { entry: NewsEntry }) {
  const detail = useNoticeDetail(entry, true);
  const view = detail.isLoading ? "loading" : detail.error ? "error" : detail.content?.empty ? "empty" : "body";
  return (
    <div className="mt-3">
      <AutoHeight>
        <Swap id={view}>
          {detail.isLoading ? <LoadingRow label="본문 불러오는 중…" /> : null}
          {detail.error ? (
            <ErrorRow message={describeError(detail.error)} onRetry={() => void detail.refetch()} />
          ) : null}
          {detail.content?.empty ? (
            <div className="text-[12px] text-muted-foreground">본문이 비어 있어요</div>
          ) : detail.content ? (
            <div ref={bindLinks} className={BODY_CLASS} dangerouslySetInnerHTML={{ __html: detail.content.html }} />
          ) : null}
        </Swap>
      </AutoHeight>
      <Button variant="ghost" className="mt-1" onClick={() => void openExternal(entry.url)} disabled={!entry.url}>
        <ExternalLink />
        웹에서 열기
      </Button>
    </div>
  );
}

const BODY_CLASS = [
  "text-[12px] leading-relaxed break-words text-foreground/90 select-text",
  "[&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4",
  "[&_h1]:my-1.5 [&_h1]:font-semibold [&_h2]:my-1.5 [&_h2]:font-semibold [&_h3]:my-1.5 [&_h3]:font-semibold",
  "[&_hr]:my-2 [&_hr]:border-border",
  "[&_img]:my-1 [&_img]:inline-block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_table]:my-1 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse",
  "[&_td]:border [&_td]:border-border [&_td]:px-1.5 [&_td]:py-0.5 [&_th]:border [&_th]:border-border [&_th]:px-1.5 [&_th]:py-0.5",
].join(" ");

function bindLinks(el: HTMLDivElement | null) {
  if (!el) return;
  const onClick = (e: MouseEvent) => {
    const anchor = (e.target as Element).closest("a");
    if (!anchor) return;
    e.preventDefault();
    if (anchor.href) void openExternal(anchor.href);
  };
  el.addEventListener("click", onClick);
  return () => el.removeEventListener("click", onClick);
}
