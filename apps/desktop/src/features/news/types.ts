import type { NewsEntry } from "@erda/core";
import { z } from "zod";

const newsEntrySchema = z.object({
  id: z.string(),
  category: z.enum(["notice", "update", "event", "cashshop"]),
  noticeId: z.number(),
  title: z.string(),
  url: z.string(),
  date: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  ongoing: z.boolean().nullable(),
}) satisfies z.ZodType<NewsEntry>;

export const noticesSnapshotSchema = z.object({
  entries: z.array(newsEntrySchema),
  seen: z.array(z.string()),
  updatedAt: z.number().nullable(),
  lastError: z.string().nullable(),
  loading: z.boolean(),
  hasKey: z.boolean(),
  rev: z.number(),
});
export type NoticesSnapshot = z.infer<typeof noticesSnapshotSchema>;

export const EMPTY_NOTICES: NoticesSnapshot = {
  entries: [],
  seen: [],
  updatedAt: null,
  lastError: null,
  loading: false,
  hasKey: false,
  rev: 0,
};

export const newerNotices = (current: NoticesSnapshot | null, next: NoticesSnapshot) =>
  current === null || next.rev >= current.rev;
