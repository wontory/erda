import { asRecord, recordList, stringField } from "#/shared/raw.ts";

export interface Achievement {
  name: string;
  description: string;
}

export function flattenAchievements(res: unknown): Achievement[] {
  return recordList(asRecord(res).account_list)
    .flatMap((account) => recordList(account.achievement_achieve))
    .filter((x) => stringField(x, "achievement_name").length > 0)
    .map((x) => ({ name: stringField(x, "achievement_name"), description: stringField(x, "achievement_description") }));
}

export function filterAchievements(list: Achievement[], q: string): Achievement[] {
  const t = q.trim();
  return t ? list.filter((a) => a.name.includes(t) || a.description.includes(t)) : list;
}
