import type { NewsCategory } from "@erda/core";
import { invoke } from "@tauri-apps/api/core";

export const noticesCommands = {
  snapshot: () => invoke<unknown>("notices_snapshot"),
  refresh: (force: boolean) => invoke<void>("notices_refresh", { force }),
  markSeen: (ids: string[]) => invoke<void>("notices_mark_seen", { ids }),
  markAllSeen: (categories: NewsCategory[]) => invoke<void>("notices_mark_all_seen", { categories }),
};
