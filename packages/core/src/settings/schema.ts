import { z } from "zod";

export const SettingsSchema = z.object({
  "settings.apiKey": z.string().default(""),
  "settings.mainCharacterName": z.string().default(""),
  "settings.arcaneDailyGrowth": z.number().int().min(1).max(60).default(8),
  "settings.authenticDailyGrowth": z.number().int().min(1).max(60).default(10),
  "settings.timerOverlaySeconds": z.number().int().min(0).max(60).default(5),
  "settings.timerTickSound": z.boolean().default(true),
  "settings.timerSound": z.boolean().default(true),
  "settings.timerDucking": z.boolean().default(true),
  "settings.historySyncDailyBudget": z.number().int().min(0).max(5000).default(500),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsKey = keyof Settings;

export const SETTINGS_DEFAULTS: Settings = SettingsSchema.parse({});

export const normalizeApiKey = (raw: string) => raw.trim();
export const hasApiKey = (apiKey: string) => normalizeApiKey(apiKey).length > 0;
