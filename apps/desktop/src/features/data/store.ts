import { lazyStore } from "#/lib/store.ts";

export const getDataStore = lazyStore("data.json", { autoSave: true });

export const DATA_KEYS = {
  main: "character.main",
  favorites: "character.favorites",
  recent: "character.recent",
  accountList: "character.accountList",
  skillGrade: "extra.skillGrade",
  lastPage: "nav.lastPage",
  timerGroups: "timers.groups",
  timerStartMode: "timers.startMode",
  recentPresets: "timers.recentPresets",
  bossState: "boss.state",
  bossUseScheduler: "boss.useScheduler",
} as const;
