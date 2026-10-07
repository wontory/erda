import { findBoss, type BossCycle } from "./catalog.ts";
import { partyOf, revenueOf, type BossRow, type BossState } from "./manual.ts";

type Maybe<T> = T | null | undefined;

export interface SchedulerBossContent {
  content_name?: Maybe<string>;
  difficulty?: Maybe<string>;
  cycle?: Maybe<string>;
  list_order_no?: Maybe<number>;
  registration_flag?: Maybe<string>;
  complete_flag?: Maybe<string>;
}

export interface SchedulerHomeworkContent {
  content_name?: Maybe<string>;
  type?: Maybe<string>;
  registration_flag?: Maybe<string>;
  now_count?: Maybe<number>;
  max_count?: Maybe<number>;
  quest_state?: Maybe<string>;
}

export interface SchedulerSnapshot {
  boss_contents?: Maybe<SchedulerBossContent[]>;
  daily_contents?: Maybe<SchedulerHomeworkContent[]>;
  weekly_contents?: Maybe<SchedulerHomeworkContent[]>;
  weekly_boss_clear_count?: Maybe<number>;
  weekly_boss_clear_limit_count?: Maybe<number>;
}

export interface HomeworkItem {
  key: string;
  name: string;
  shortName: string;
  done: boolean;
  progress: string;
}

const QUEST_IN_PROGRESS = "1";
const QUEST_COMPLETED = "2";

const DIFFICULTY_KO: Record<string, string> = {
  easy: "이지",
  normal: "노멀",
  hard: "하드",
  chaos: "카오스",
  extreme: "익스트림",
};

const isFlagSet = (flag: Maybe<string>) => flag === "true";

export const difficultyKo = (raw: Maybe<string>): string => (raw ? (DIFFICULTY_KO[raw] ?? raw) : "");

export function cycleOf(raw: Maybe<string>): BossCycle {
  switch (raw) {
    case "bossDaily":
      return "daily";
    case "bossMonthly":
      return "monthly";
    default:
      return "weekly";
  }
}

function toBossRow(content: SchedulerBossContent, cycle: BossCycle, state: BossState): BossRow {
  const name = content.content_name ?? "";
  const difficulty = difficultyKo(content.difficulty);
  const entry = findBoss(name, difficulty);
  const registered = isFlagSet(content.registration_flag);
  return {
    key: `${name}|${difficulty}`,
    catalogId: entry?.id ?? null,
    name,
    difficulty,
    cycle,
    party: entry ? partyOf(state, entry.id) : 1,
    revenue: entry ? revenueOf(state, entry) : 0,
    cleared: registered && isFlagSet(content.complete_flag),
    inCatalog: !!entry,
    registered,
    order: content.list_order_no ?? 0,
  };
}

export function schedulerRows(snapshot: SchedulerSnapshot, cycle: BossCycle, state: BossState): BossRow[] {
  return (snapshot.boss_contents ?? [])
    .filter((c) => cycleOf(c.cycle) === cycle)
    .toSorted((a, b) => (a.list_order_no ?? 0) - (b.list_order_no ?? 0))
    .map((c) => toBossRow(c, cycle, state));
}

function homeworkListOf(snapshot: SchedulerSnapshot, cycle: BossCycle): Maybe<SchedulerHomeworkContent[]> {
  switch (cycle) {
    case "daily":
      return snapshot.daily_contents;
    case "weekly":
      return snapshot.weekly_contents;
    case "monthly":
      return [];
  }
}

function isHomeworkDone(content: SchedulerHomeworkContent, now: number, max: number): boolean {
  if (content.type === "quest") return content.quest_state === QUEST_COMPLETED;
  return max > 0 ? now >= max : now > 0;
}

const HOMEWORK_UNITS: Record<string, string> = {
  "[길드] 지하 수로": "점",
  "[길드] 플래그 레이스": "점",
  무릉도장: "층",
};

const homeworkUnit = (name: string): string => HOMEWORK_UNITS[name] ?? "회";
const EPIC_DUNGEON_STAGES = 5;
const isEpicDungeon = (name: string): boolean => name.startsWith("에픽 던전");

function homeworkProgress(content: SchedulerHomeworkContent, now: number, max: number): string {
  if (content.type === "quest") {
    if (content.quest_state === QUEST_COMPLETED) return "완료";
    return content.quest_state === QUEST_IN_PROGRESS ? "진행 중" : "";
  }
  if (isEpicDungeon(content.content_name ?? "")) return `스테이지 ${now}/${max}`;
  return max > 0 ? `${now}/${max}` : `${now.toLocaleString("en-US")}${homeworkUnit(content.content_name ?? "")}`;
}

function toHomeworkItem(content: SchedulerHomeworkContent): HomeworkItem {
  const name = content.content_name ?? "";
  const now = content.now_count ?? 0;
  const max = isEpicDungeon(name) ? EPIC_DUNGEON_STAGES : (content.max_count ?? 0);
  return {
    key: name,
    name,
    shortName: name.replace(/^\[[^\]]*\]\s*/, ""),
    done: isHomeworkDone(content, now, max),
    progress: homeworkProgress(content, now, max),
  };
}

const isEpic = (c: SchedulerHomeworkContent) => isEpicDungeon(c.content_name ?? "");

const isClearedEpic = (c: SchedulerHomeworkContent) => isEpic(c) && (c.now_count ?? 0) >= EPIC_DUNGEON_STAGES;

export function homeworkOf(snapshot: SchedulerSnapshot, cycle: BossCycle): HomeworkItem[] {
  return (homeworkListOf(snapshot, cycle) ?? [])
    .filter((c) => isFlagSet(c.registration_flag) || isClearedEpic(c))
    .map(toHomeworkItem);
}

export function weeklyBossLimit(snapshot: SchedulerSnapshot): { count: number; limit: number } | null {
  const limit = snapshot.weekly_boss_clear_limit_count;
  if (limit === null || limit === undefined) return null;
  return { count: snapshot.weekly_boss_clear_count ?? 0, limit };
}
