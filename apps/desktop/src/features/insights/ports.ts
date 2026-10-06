import { NexonError, describeError } from "@erda/api/errors";
import {
  getHistoryCube,
  getHistoryPotential,
  getHistorySoulPotential,
} from "@erda/api/generated/endpoints/potential/potential";
import { getHistoryStarforce } from "@erda/api/generated/endpoints/starforce/starforce";
import {
  emptyArchive,
  listOf,
  nextCursorOf,
  parseArchive,
  type HistoryArchive,
  type HistoryKind,
  type SyncPorts,
} from "@erda/core";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

import { getSettingsStore } from "#/features/settings/store.ts";
import { parseSetting } from "#/features/settings/use-settings.ts";

import { fetchCallsToday } from "./commands.ts";

const CORRUPT_MESSAGE = "기록 파일을 읽을 수 없어요. 파일을 덮어쓰지 않도록 이 기록은 받지 않아요.";

type PageArgs = { date?: string; cursor?: string };
type Opts = { nexonCache: "useCache" | "refresh" };

const FETCH: Record<HistoryKind, (a: PageArgs, o: Opts) => Promise<unknown>> = {
  starforce: (a, o) => getHistoryStarforce({ count: "1000", ...a }, o),
  potential: (a, o) => getHistoryPotential({ count: 1000, ...a }, o),
  cube: (a, o) => getHistoryCube({ count: 1000, ...a }, o),
  soul: (a, o) => getHistorySoulPotential({ count: 1000, ...a }, o),
};

const loadedSchema = z.object({ folder: z.string().nullable(), json: z.string().nullable() });

const folders = new Map<HistoryKind, string | null>();
const loadSeq = new Map<HistoryKind, number>();

type Invoke = (cmd: string, args: Record<string, unknown>) => Promise<unknown>;

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export async function loadArchive(kind: HistoryKind, call: Invoke = invoke): Promise<HistoryArchive> {
  const seq = (loadSeq.get(kind) ?? 0) + 1;
  loadSeq.set(kind, seq);
  const loaded = loadedSchema.safeParse(await call("history_load", { kind }));
  if (!loaded.success) throw new Error(CORRUPT_MESSAGE);
  const { folder, json } = loaded.data;
  if (loadSeq.get(kind) === seq) folders.set(kind, folder);
  if (json == null) return emptyArchive(kind);
  const archive = parseArchive(parseJson(json), kind);
  if (!archive) throw new Error(CORRUPT_MESSAGE);
  return archive;
}

export function createPorts(): SyncPorts {
  return {
    load: (kind) => loadArchive(kind),
    save: (archive) =>
      invoke("history_save", {
        kind: archive.kind,
        json: JSON.stringify(archive),
        folder: folders.get(archive.kind) ?? null,
      }),
    fetchPage: async (kind, args, force) => {
      const res = await FETCH[kind](args, { nexonCache: force ? "refresh" : "useCache" });
      return { entries: listOf(kind, res), nextCursor: nextCursorOf(res) };
    },
    callsToday: fetchCallsToday,
    budget: async () => {
      const store = await getSettingsStore();
      return parseSetting(
        "settings.historySyncDailyBudget",
        await store.get<unknown>("settings.historySyncDailyBudget"),
      );
    },
    now: () => Date.now(),
    sleep: (ms) => invoke("sleep_ms", { ms: Math.max(0, Math.round(ms)) }),
    isRateLimited: (e) => NexonError.from(e).status === 429,
    describe: (e) => describeError(e),
  };
}
