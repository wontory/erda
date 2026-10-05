import { asRecord, numberField, stringField, type RawRecord } from "#/shared/raw.ts";

export type HistoryKind = "starforce" | "potential" | "cube" | "soul";
export const HISTORY_KINDS: HistoryKind[] = ["starforce", "potential", "cube", "soul"];

export type HistoryResult = "success" | "fail" | "destroy" | "upgrade" | "keep";
export const RESULT_LABEL: Record<HistoryResult, string> = {
  success: "성공",
  fail: "실패",
  destroy: "파괴",
  upgrade: "등급업",
  keep: "유지",
};

export interface HistoryEntry {
  id: string;
  date: string;
  character: string;
  target: string;
  part: string | null;
  result: HistoryResult;
  headline: string;
  details: string[];
  flags: string[];
  stack: number | null;
}

export interface HistoryMeta {
  title: string;
  color: string;
  text: string;
  icon: string;
  path: string;
  listKey: string;
  floor: string | null;
  goodLabel: "성공" | "등급업";
  rateLabel: "성공률" | "등급업률";
}

export const HISTORY_META: Record<HistoryKind, HistoryMeta> = {
  starforce: {
    title: "스타포스",
    color: "bg-orange-500",
    text: "text-orange-500",
    icon: "Star",
    path: "/maplestory/v1/history/starforce",
    listKey: "starforce_history",
    floor: "2023-12-27",
    goodLabel: "성공",
    rateLabel: "성공률",
  },
  potential: {
    title: "잠재",
    color: "bg-purple-500",
    text: "text-purple-500",
    icon: "Sparkles",
    path: "/maplestory/v1/history/potential",
    listKey: "potential_history",
    floor: "2024-01-25",
    goodLabel: "등급업",
    rateLabel: "등급업률",
  },
  cube: {
    title: "큐브",
    color: "bg-indigo-500",
    text: "text-indigo-500",
    icon: "Box",
    path: "/maplestory/v1/history/cube",
    listKey: "cube_history",
    floor: null,
    goodLabel: "등급업",
    rateLabel: "등급업률",
  },
  soul: {
    title: "소울",
    color: "bg-teal-500",
    text: "text-teal-500",
    icon: "Stamp",
    path: "/maplestory/v1/history/soul-potential",
    listKey: "soul_potential_history",
    floor: null,
    goodLabel: "등급업",
    rateLabel: "등급업률",
  },
};

interface RawOption {
  value: string;
  grade: string;
}

const STARFORCE_OPTIONAL_FLAGS: ReadonlyArray<readonly [key: string, label: string]> = [
  ["chance_time", "찬스타임"],
  ["protect_shield", "파괴방지"],
  ["superior_item_flag", "슈페리얼"],
  ["event_field_flag", "이벤트맵"],
  ["bonus_stat_upgrade", "보너스 스탯"],
];

const text = (v: unknown): string => (v === null || v === undefined || typeof v === "object" ? "" : String(v));

function options(r: RawRecord, key: string): RawOption[] {
  const list = r[key];
  if (!Array.isArray(list)) return [];
  return list.map((o) => {
    const option = asRecord(o);
    return { value: text(option.value), grade: text(option.grade) };
  });
}

const optionValues = (list: RawOption[]) => list.map((o) => o.value).filter(Boolean);

const applied = (v: string) => v.length > 0 && !/미적용|미해당|미사용/.test(v);

function stackOf(r: RawRecord): number | null {
  const n = numberField(r, "upgrade_guarantee_count");
  return n !== null && n > 0 ? n : null;
}

const pityFlag = (r: RawRecord) => (r.upgrade_guarantee === true ? ["천장 도달"] : []);

const upgradeResult = (r: RawRecord): HistoryResult =>
  stringField(r, "item_upgrade_result").includes("성공") ? "upgrade" : "keep";

function common(r: RawRecord) {
  return {
    id: stringField(r, "id"),
    date: stringField(r, "date_create"),
    character: stringField(r, "character_name"),
    target: stringField(r, "target_item"),
  };
}

function starforceResult(outcome: string): HistoryResult {
  if (outcome.includes("파괴")) return "destroy";
  if (outcome.includes("성공")) return "success";
  return "fail";
}

function starforceFlags(r: RawRecord): string[] {
  const flags: string[] = [];
  if (stringField(r, "starcatch_result") === "성공") flags.push("스타캐치");
  for (const [key, label] of STARFORCE_OPTIONAL_FLAGS) {
    if (applied(stringField(r, key))) flags.push(label);
  }
  return flags;
}

function starforceEventDetail(event: RawRecord): string {
  const field = (key: string) => stringField(event, key) || "-";
  return `이벤트: 성공률 ${field("success_rate")}, 파괴 확률 ${field("destroy_decrease_rate")}, 비용 ${field("cost_discount_rate")}, +${field("plus_value")}`;
}

export function mapStarforce(raw: unknown): HistoryEntry {
  const r = asRecord(raw);
  const outcome = stringField(r, "item_upgrade_result");
  const events = Array.isArray(r.starforce_event_list) ? (r.starforce_event_list as unknown[]).map(asRecord) : [];
  const before = numberField(r, "before_starforce_count") ?? 0;
  const after = numberField(r, "after_starforce_count") ?? 0;
  return {
    ...common(r),
    part: null,
    result: starforceResult(outcome),
    headline: `${before}★ → ${after}★ ${outcome}`.trim(),
    details: events.map(starforceEventDetail),
    flags: starforceFlags(r),
    stack: null,
  };
}

export function mapPotential(raw: unknown, kind: "potential" | "cube"): HistoryEntry {
  const r = asRecord(raw);
  const additional =
    options(r, "after_potential_option").length === 0 && options(r, "after_additional_potential_option").length > 0;
  const beforeOpts = options(r, additional ? "before_additional_potential_option" : "before_potential_option");
  const afterOpts = options(r, additional ? "after_additional_potential_option" : "after_potential_option");
  const before = beforeOpts[0]?.grade || "-";
  const after = stringField(r, additional ? "additional_potential_option_grade" : "potential_option_grade") || "-";
  const type =
    kind === "potential" ? stringField(r, "potential_type") || "잠재능력" : stringField(r, "cube_type") || "큐브";
  const flags = [...(stringField(r, "miracle_time_flag") === "true" ? ["미라클타임"] : []), ...pityFlag(r)];
  return {
    ...common(r),
    part: stringField(r, "item_equipment_part") || null,
    result: upgradeResult(r),
    headline: `${type} · ${before} → ${after}`,
    details: optionValues(afterOpts),
    flags,
    stack: stackOf(r),
  };
}

function amplifiedGrade(r: RawRecord): number {
  const raw = r.soul_potential_amplified_grade;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return 0;
}

export function mapSoul(raw: unknown): HistoryEntry {
  const r = asRecord(raw);
  const amplified = amplifiedGrade(r);
  const flags = [...pityFlag(r), ...(Number.isFinite(amplified) && amplified > 0 ? [`증폭 ${amplified}`] : [])];
  const before = options(r, "before_soul_potential_option")[0]?.grade || "-";
  const after = stringField(r, "soul_potential_grade") || "-";
  return {
    ...common(r),
    part: null,
    result: upgradeResult(r),
    headline: `소울 잠재 · ${before} → ${after}`,
    details: optionValues(options(r, "after_soul_potential_option")),
    flags,
    stack: stackOf(r),
  };
}

export function mapHistory(kind: HistoryKind, raw: unknown): HistoryEntry {
  switch (kind) {
    case "starforce":
      return mapStarforce(raw);
    case "potential":
    case "cube":
      return mapPotential(raw, kind);
    case "soul":
      return mapSoul(raw);
  }
}

export function listOf(kind: HistoryKind, response: unknown): unknown[] {
  const list = asRecord(response)[HISTORY_META[kind].listKey];
  return Array.isArray(list) ? list : [];
}

export function nextCursorOf(response: unknown): string | null {
  const c = asRecord(response).next_cursor;
  return typeof c === "string" && c.length > 0 ? c : null;
}
