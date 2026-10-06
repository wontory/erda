import { SETTINGS_DEFAULTS } from "@erda/core";

import { lazyStore } from "#/lib/store.ts";

export const getSettingsStore = lazyStore("settings.json", { autoSave: true, defaults: SETTINGS_DEFAULTS });
