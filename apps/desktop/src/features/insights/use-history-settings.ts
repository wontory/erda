import { useSettingChange } from "#/features/settings/use-setting-change.ts";

import { nudgeHistory, resetHistory } from "./history-store.ts";

export function useHistorySettings() {
  useSettingChange("settings.apiKey", () => resetHistory());
  useSettingChange("settings.historySyncDailyBudget", () => nudgeHistory());
}
