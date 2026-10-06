import { hasApiKey, unreadCount } from "@erda/core";
import { useMemo } from "react";

import { useSettingChange } from "#/features/settings/use-setting-change.ts";
import { useSetting } from "#/features/settings/use-settings.ts";
import { useSnapshotSubscription } from "#/lib/use-snapshot-subscription.ts";

import { noticesCommands } from "./commands.ts";
import { EMPTY_NOTICES, newerNotices, noticesSnapshotSchema } from "./types.ts";

const snapshot = () => noticesCommands.snapshot();

function useRefreshWhenKeyAdded() {
  useSettingChange("settings.apiKey", (next, prev) => {
    if (hasApiKey(prev) || !hasApiKey(next)) return;
    noticesCommands.refresh(false).catch((e) => console.error("notices_refresh failed", e));
  });
}

export function useNotices() {
  const {
    data: snap,
    loaded,
    error,
    retry,
  } = useSnapshotSubscription({
    event: "notices:updated",
    schema: noticesSnapshotSchema,
    snapshot,
    initial: EMPTY_NOTICES,
    newer: newerNotices,
  });
  const [apiKey, , apiKeyLoaded] = useSetting("settings.apiKey");
  useRefreshWhenKeyAdded();
  const keySet = apiKeyLoaded && hasApiKey(apiKey);
  const keyMissing = apiKeyLoaded && !hasApiKey(apiKey);
  const seenSet = useMemo(() => new Set(snap.seen), [snap.seen]);
  return { ...snap, loaded, error, retry, keySet, keyMissing, seenSet, unread: unreadCount(snap.entries, seenSet) };
}
