export const SETTINGS_PAGE_IDS = ["general", "character", "timer", "about"] as const;
export type SettingsPageId = (typeof SETTINGS_PAGE_IDS)[number];

export function parseSettingsPage(value: unknown): SettingsPageId | null {
  if (value === "symbol") return "character";
  return SETTINGS_PAGE_IDS.find((id) => id === value) ?? null;
}
