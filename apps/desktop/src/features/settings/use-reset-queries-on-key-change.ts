import { useQueryClient } from "@tanstack/react-query";

import { clearAccountList } from "#/features/character/use-account-characters.ts";

import { useSettingChange } from "./use-setting-change.ts";

export function useResetQueriesOnKeyChange() {
  const queryClient = useQueryClient();
  useSettingChange("settings.apiKey", () => {
    void clearAccountList();
    void queryClient.resetQueries();
  });
}
