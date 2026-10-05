import { compareDesc } from "#/shared/compare.ts";
import { asRecord, numberField, recordList, stringField, type RawRecord } from "#/shared/raw.ts";

export interface Replay {
  id: string;
  date: string;
  period: number;
}

export interface SkillShare {
  name: string;
  damage: number;
  percent: number;
  uses: number;
}

const num = (r: RawRecord, key: string): number => numberField(r, key) ?? 0;

export function topReplays(res: unknown, n = 5): Replay[] {
  return recordList(asRecord(res).replay_list)
    .map((r) => ({
      id: stringField(r, "replay_id"),
      date: stringField(r, "register_date"),
      period: num(r, "period_no"),
    }))
    .filter((r) => r.id)
    .toSorted((a, b) => compareDesc(a.date, b.date))
    .slice(0, n);
}

function damagePercent(skill: RawRecord, totalDamage: number): number {
  const reported = numberField(skill, "damage_percent");
  if (reported !== null) return reported;
  return totalDamage > 0 ? Math.round((num(skill, "damage") / totalDamage) * 1000) / 10 : 0;
}

export function topSkills(result: unknown, n = 6): SkillShare[] {
  const r = asRecord(result);
  const total = num(r, "total_damage");
  return recordList(r.skill_statistic)
    .map((s) => ({
      name: stringField(s, "skill_name"),
      damage: num(s, "damage"),
      percent: damagePercent(s, total),
      uses: num(s, "use_count"),
    }))
    .toSorted((a, b) => b.damage - a.damage)
    .slice(0, n);
}

export function replaySummary(result: unknown) {
  const r = asRecord(result);
  return {
    totalDamage: num(r, "total_damage"),
    dps: num(r, "total_dps"),
    playTime: num(r, "total_play_time"),
    endType: stringField(r, "end_type"),
  };
}
