import { CALCULATOR_IDS, DETAIL_PAGES, HISTORY_KINDS, SIMULATOR_IDS } from "@erda/core";
import { z } from "zod";

import { DATA_KEYS, getDataStore } from "#/features/data/store.ts";

import type { Page } from "./stack.ts";

const fixedPage = <K extends string>(kind: K) => z.object({ kind: z.literal(kind), id: z.literal(kind) });

const pageSchema = z.discriminatedUnion("kind", [
  fixedPage("home"),
  fixedPage("character"),
  fixedPage("timers"),
  fixedPage("scheduler"),
  fixedPage("news"),
  z.object({ kind: z.literal("article"), id: z.string(), entryId: z.string() }),
  z.object({ kind: z.literal("calculator"), id: z.string(), calculator: z.enum(CALCULATOR_IDS) }),
  z.object({ kind: z.literal("simulator"), id: z.string(), simulator: z.enum(SIMULATOR_IDS) }),
  fixedPage("account"),
  z.object({ kind: z.literal("history"), id: z.string(), history: z.enum(HISTORY_KINDS) }),
  fixedPage("achievements"),
  z.object({ kind: z.literal("results"), id: z.string(), query: z.string() }),
  z.object({ kind: z.literal("viewing"), id: z.string(), ocid: z.string(), name: z.string() }),
  z.object({
    kind: z.literal("section"),
    id: z.string(),
    ocid: z.string(),
    name: z.string(),
    page: z.enum(DETAIL_PAGES.map((p) => p.id)),
  }),
  z.object({ kind: z.literal("guild"), id: z.string(), world: z.string(), name: z.string() }),
]);

export async function persistTopPage(page: Page) {
  try {
    const store = await getDataStore();
    await store.set(DATA_KEYS.lastPage, page);
  } catch (e) {
    console.error("persist page failed", e);
  }
}

export async function readLastPage(): Promise<Page | null> {
  try {
    const store = await getDataStore();
    const parsed = pageSchema.safeParse(await store.get(DATA_KEYS.lastPage));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function clearLastPage() {
  try {
    const store = await getDataStore();
    await store.delete(DATA_KEYS.lastPage);
  } catch (e) {
    console.error("clear page failed", e);
  }
}
