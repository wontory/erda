import { MotionProvider } from "@erda/ui/components/motion-provider";
import { Toaster } from "@erda/ui/components/ui/toast";
import { QueryClientProvider } from "@tanstack/react-query";

import { MainCharacterProvider } from "#/features/character/main-character-provider.tsx";
import { useResetQueriesOnKeyChange } from "#/features/settings/use-reset-queries-on-key-change.ts";
import { queryClient } from "#/lib/query.ts";

import { SettingsApp } from "./settings-app.tsx";

export function SettingsRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <SettingsBody />
        <Toaster />
      </MotionProvider>
    </QueryClientProvider>
  );
}

function SettingsBody() {
  useResetQueriesOnKeyChange();
  return (
    <MainCharacterProvider>
      <SettingsApp />
    </MainCharacterProvider>
  );
}
