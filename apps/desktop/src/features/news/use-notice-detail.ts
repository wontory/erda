import {
  getNoticeCashshopDetail,
  getNoticeDetail,
  getNoticeEventDetail,
  getNoticeUpdateDetail,
} from "@erda/api/generated/endpoints/notice/notice";
import type { NexonCachePolicy } from "@erda/api/mutator";
import type { NewsEntry } from "@erda/core";
import { useQuery } from "@tanstack/react-query";

import { STALE, newsKeys } from "#/features/api/query-keys.ts";
import { takePolicy } from "#/features/api/refresh.ts";
import { sanitizeNoticeHtml, type NoticeHtml } from "#/features/news/notice-html.ts";

async function fetchDetail(e: NewsEntry, policy: NexonCachePolicy): Promise<NoticeHtml> {
  const params = { notice_id: e.noticeId };
  const opts = { nexonCache: policy };
  const res =
    e.category === "notice"
      ? await getNoticeDetail(params, opts)
      : e.category === "update"
        ? await getNoticeUpdateDetail(params, opts)
        : e.category === "event"
          ? await getNoticeEventDetail(params, opts)
          : await getNoticeCashshopDetail(params, opts);
  return sanitizeNoticeHtml(res.contents ?? "");
}

export function useNoticeDetail(entry: NewsEntry, enabled: boolean) {
  const key = newsKeys.detail(entry.id);
  const q = useQuery({
    queryKey: key,
    queryFn: () => fetchDetail(entry, takePolicy(key)),
    enabled,
    staleTime: STALE.forever,
    gcTime: 60 * 60_000,
  });
  return { content: q.data, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
}
