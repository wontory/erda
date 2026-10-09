import { z } from "zod";

import {
  LINE_LIMITS,
  POTENTIAL_GRADES,
  POTENTIAL_KINDS,
  POTENTIAL_MAX_LEVEL,
  POTENTIAL_PARTS,
  RESET_MESO_BANDS,
  SOUL_RESET_MESO,
  SOUL_STEPS,
  UPGRADE_CEILINGS,
  UPGRADE_PPM,
  WEAPON_PART,
  type PotentialGrade,
  type PotentialKind,
} from "#/simulators/data/potential-rules.ts";
import { PPM } from "#/simulators/starforce.ts";

export interface PotentialData {
  POTENTIAL_DATA_DATE: string;
  POTENTIAL_OPTIONS: readonly string[];
  POTENTIAL_TABLES: readonly (readonly number[])[];
  POTENTIAL_BANDS: Readonly<Record<"main" | "additional", readonly (readonly (readonly (readonly number[])[])[])[]>>;
  SOUL_POTENTIAL_TABLES: readonly (readonly (readonly number[])[])[];
}

export type Rng = (bound: number) => number;

export interface PotentialTarget {
  kind: PotentialKind;
  part: number;
  level: number;
  soulStep: number;
}

export interface OptionEntry {
  text: string;
  lower: boolean;
  weight: number;
}

export type LineTables = readonly [readonly OptionEntry[], readonly OptionEntry[], readonly OptionEntry[]];

export interface PotentialLine {
  text: string;
  lower: boolean;
}

export interface PotentialRoll {
  grade: PotentialGrade;
  lines: readonly PotentialLine[];
}

export const gradeIndex = (grade: PotentialGrade): number => POTENTIAL_GRADES.indexOf(grade);

export const lineGrade = (grade: PotentialGrade, line: PotentialLine): PotentialGrade | null =>
  line.lower ? (POTENTIAL_GRADES[gradeIndex(grade) - 1] ?? null) : grade;

export const supportsKind = (kind: PotentialKind, part: number): boolean => kind !== "soul" || part === WEAPON_PART;

export const clampPotentialLevel = (level: number): number =>
  Math.min(POTENTIAL_MAX_LEVEL, Math.max(0, Math.trunc(level)));

const decoded = new WeakMap<readonly number[], OptionEntry[]>();

function decodeTable(data: PotentialData, id: number): OptionEntry[] {
  const flat = data.POTENTIAL_TABLES[id];
  let entries = decoded.get(flat);
  if (!entries) {
    entries = [];
    for (let i = 0; i < flat.length; i += 2) {
      entries.push({ text: data.POTENTIAL_OPTIONS[flat[i] >> 1], lower: (flat[i] & 1) === 1, weight: flat[i + 1] });
    }
    decoded.set(flat, entries);
  }
  return entries;
}

export function lineTables(data: PotentialData, target: PotentialTarget, grade: PotentialGrade): LineTables | null {
  if (!supportsKind(target.kind, target.part)) return null;
  const g = gradeIndex(grade);
  let ids: readonly number[] | undefined;
  if (target.kind === "soul") {
    ids = data.SOUL_POTENTIAL_TABLES[g]?.[target.soulStep - 1];
  } else {
    const bands = data.POTENTIAL_BANDS[target.kind][target.part - 1]?.[g] ?? [];
    let band: readonly number[] | undefined;
    for (const b of bands) if (b[0] <= target.level) band = b;
    ids = band?.slice(1);
  }
  if (!ids || ids.length !== 3) return null;
  return [decodeTable(data, ids[0]), decodeTable(data, ids[1]), decodeTable(data, ids[2])];
}

function allowed(entry: OptionEntry, picked: readonly PotentialLine[]): boolean {
  for (const limit of LINE_LIMITS) {
    if (!limit.pattern.test(entry.text)) continue;
    if (picked.filter((p) => limit.pattern.test(p.text)).length >= limit.max) return false;
  }
  return true;
}

function pick(entries: readonly OptionEntry[], picked: readonly PotentialLine[], rng: Rng): PotentialLine {
  const pool = entries.filter((e) => allowed(e, picked));
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng(total);
  for (const e of pool) {
    if (roll < e.weight) return { text: e.text, lower: e.lower };
    roll -= e.weight;
  }
  const last = pool[pool.length - 1];
  return { text: last.text, lower: last.lower };
}

const sameLines = (a: readonly PotentialLine[], b: readonly PotentialLine[]): boolean =>
  a.length === b.length && a.every((l, i) => l.text === b[i].text);

export function rollLines(tables: LineTables, rng: Rng, previous?: readonly PotentialLine[]): PotentialLine[] {
  for (let tries = 0; ; tries++) {
    const lines: PotentialLine[] = [];
    for (const table of tables) lines.push(pick(table, lines, rng));
    if (!previous || tries >= 100 || !sameLines(lines, previous)) return lines;
  }
}

export function resetMeso(target: PotentialTarget, grade: PotentialGrade): number {
  const g = gradeIndex(grade);
  if (target.kind === "soul") return SOUL_RESET_MESO[g];
  const band = RESET_MESO_BANDS.find(([min]) => target.level >= min) ?? RESET_MESO_BANDS[RESET_MESO_BANDS.length - 1];
  return (target.kind === "main" ? band[1] : band[2])[g];
}

export interface UpgradeOdds {
  ppm: number;
  ceiling: number;
  guaranteed: boolean;
}

export function upgradeOdds(kind: PotentialKind, grade: PotentialGrade, pity: number): UpgradeOdds | null {
  const g = gradeIndex(grade);
  if (g >= POTENTIAL_GRADES.length - 1) return null;
  const ceiling = UPGRADE_CEILINGS[kind][g];
  const guaranteed = pity + 1 >= ceiling;
  return { ppm: guaranteed ? PPM : UPGRADE_PPM[kind][g], ceiling, guaranteed };
}

export interface PotentialLedger {
  resets: number;
  upgrades: number;
  meso: bigint;
}

export const EMPTY_POTENTIAL_LEDGER: PotentialLedger = { resets: 0, upgrades: 0, meso: 0n };

export interface PendingRoll extends PotentialRoll {
  upgraded: boolean;
  guaranteed: boolean;
}

export interface PotentialState {
  current: PotentialRoll;
  pending: readonly PendingRoll[];
  pity: number;
  ledger: PotentialLedger;
}

export function initialPotentialState(
  data: PotentialData,
  target: PotentialTarget,
  start: PotentialRoll,
  rng: Rng,
): PotentialState | null {
  const tables = lineTables(data, target, start.grade);
  if (!tables) return null;
  const lines = start.lines.length > 0 ? start.lines : rollLines(tables, rng);
  return { current: { grade: start.grade, lines }, pending: [], pity: 0, ledger: EMPTY_POTENTIAL_LEDGER };
}

export function resetPotential(
  state: PotentialState,
  data: PotentialData,
  target: PotentialTarget,
  rng: Rng,
  times = 1,
): PotentialState | null {
  const from = state.current.grade;
  const pending: PendingRoll[] = [];
  let pity = state.pity;
  let upgrades = 0;
  for (let i = 0; i < times; i++) {
    const odds = upgradeOdds(target.kind, from, pity);
    const upgraded = odds !== null && rng(PPM) < odds.ppm;
    const grade = upgraded ? POTENTIAL_GRADES[gradeIndex(from) + 1] : from;
    const tables = lineTables(data, target, grade);
    if (!tables) return null;
    const lines = rollLines(tables, rng, upgraded ? undefined : state.current.lines);
    pending.push({ grade, lines, upgraded, guaranteed: upgraded && odds.guaranteed });
    pity = odds === null || upgraded ? 0 : pity + 1;
    if (upgraded) upgrades++;
  }
  return {
    current: state.current,
    pending,
    pity,
    ledger: {
      resets: state.ledger.resets + times,
      upgrades: state.ledger.upgrades + upgrades,
      meso: state.ledger.meso + BigInt(resetMeso(target, from)) * BigInt(times),
    },
  };
}

export type PotentialChoice = "before" | number;

export function choosePotential(state: PotentialState, choice: PotentialChoice): PotentialState {
  if (state.pending.length === 0) return state;
  const picked = choice === "before" ? undefined : state.pending[choice];
  if (!picked) return { ...state, pending: [] };
  return { ...state, current: { grade: picked.grade, lines: picked.lines }, pending: [] };
}

export const hasPendingUpgrade = (state: PotentialState): boolean => state.pending.some((p) => p.upgraded);

const STAT = /^(.+?) ([+-])(\d+)(%|초)?$/;
const MAIN_STATS = ["STR", "DEX", "INT", "LUK"];
const ALL_STAT = "올스탯";

export interface StatValue {
  key: string;
  value: number;
}

export function parseStat(text: string): StatValue | null {
  const m = STAT.exec(text);
  if (!m) return null;
  return { key: `${m[1]}${m[4] ?? ""}`, value: Number(m[3]) };
}

export function statTotals(lines: readonly PotentialLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  const add = (key: string, value: number) => totals.set(key, (totals.get(key) ?? 0) + value);
  for (const line of lines) {
    const stat = parseStat(line.text);
    if (!stat) continue;
    add(stat.key, stat.value);
    if (stat.key.startsWith(ALL_STAT)) {
      const unit = stat.key.slice(ALL_STAT.length);
      for (const s of MAIN_STATS) add(`${s}${unit}`, stat.value);
    }
  }
  return totals;
}

export const MAX_AUTO_TARGETS = 4;

export const autoTargetSchema = z.array(z.string().nullable()).length(3);
export type AutoTarget = z.infer<typeof autoTargetSchema>;

export const EMPTY_AUTO_TARGET: AutoTarget = [null, null, null];

export const potentialGoalSchema = z.object({
  grade: z.enum(POTENTIAL_GRADES).default("legendary"),
  targets: z.array(autoTargetSchema).max(MAX_AUTO_TARGETS),
});
export type PotentialGoal = z.infer<typeof potentialGoalSchema>;

export const isEmptyTarget = (target: AutoTarget): boolean => target.every((t) => t === null);

export const hasTargets = (goal: PotentialGoal): boolean => goal.targets.some((t) => !isEmptyTarget(t));

export function meetsTarget(lines: readonly PotentialLine[], target: AutoTarget): boolean {
  if (isEmptyTarget(target)) return false;
  const picked = target.filter((t): t is string => t !== null);
  const wanted = statTotals(picked.map((text) => ({ text, lower: false })));
  const got = statTotals(lines);
  for (const [key, value] of wanted) if ((got.get(key) ?? 0) < value) return false;
  const left = lines.map((l) => l.text);
  for (const text of picked) {
    if (parseStat(text)) continue;
    const i = left.indexOf(text);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

export const meetsGoal = (roll: PotentialRoll, goal: PotentialGoal): boolean =>
  goal.targets.some((t) => meetsTarget(roll.lines, t));

const LEGENDARY = POTENTIAL_GRADES[POTENTIAL_GRADES.length - 1];

export const usesTargets = (grade: PotentialGrade): boolean => grade === LEGENDARY;

const withTargets = (goal: PotentialGoal): boolean => usesTargets(goal.grade) && hasTargets(goal);

export const canStartAuto = (current: PotentialGrade, goal: PotentialGoal): boolean =>
  withTargets(goal) || gradeIndex(goal.grade) > gradeIndex(current);

export const reachesGoal = (roll: PotentialRoll, goal: PotentialGoal): boolean =>
  withTargets(goal)
    ? usesTargets(roll.grade) && meetsGoal(roll, goal)
    : gradeIndex(roll.grade) >= gradeIndex(goal.grade);

export function autoShouldStop(state: PotentialState, goal: PotentialGoal): boolean {
  if (state.pending.length === 0) return !canStartAuto(state.current.grade, goal);
  return state.pending.some((p) => reachesGoal(p, goal));
}

export interface AutoStep {
  state: PotentialState;
  done: boolean;
}

export function autoStep(state: PotentialState, goal: PotentialGoal): AutoStep {
  if (autoShouldStop(state, goal)) return { state, done: true };
  let best = -1;
  state.pending.forEach((p, i) => {
    if (p.upgraded && (best < 0 || gradeIndex(p.grade) > gradeIndex(state.pending[best].grade))) best = i;
  });
  return { state: best < 0 ? state : choosePotential(state, best), done: false };
}

const API_SEPARATOR = / ?: ?/;

export function matchLines(
  data: PotentialData,
  target: PotentialTarget,
  grade: PotentialGrade,
  texts: readonly (string | null | undefined)[],
): PotentialLine[] {
  const tables = lineTables(data, target, grade);
  return texts
    .map((raw, i) => {
      if (!raw) return null;
      const text = raw.replace(API_SEPARATOR, " ").trim();
      const entries = tables?.[i] ?? [];
      const prime = entries.some((e) => !e.lower && e.text === text);
      const lower = !prime && entries.some((e) => e.lower && e.text === text);
      return { text, lower };
    })
    .filter((l): l is PotentialLine => l !== null);
}

const potentialLineSchema = z.object({ text: z.string(), lower: z.boolean() });

export const potentialRollSchema = z.object({
  grade: z.enum(POTENTIAL_GRADES),
  lines: z.array(potentialLineSchema).max(3),
});

export const potentialItemSchema = z.object({
  name: z.string(),
  icon: z.string(),
  part: z.string(),
});
export type PotentialItem = z.infer<typeof potentialItemSchema>;

const DEFAULT_GOAL: PotentialGoal = { grade: "legendary", targets: [] };
const goalField = potentialGoalSchema.catch(DEFAULT_GOAL);

export const potentialSettingsSchema = z.object({
  item: potentialItemSchema.nullable().default(null),
  part: z.number().int().min(1).max(POTENTIAL_PARTS.length),
  level: z.number().int().min(0).max(POTENTIAL_MAX_LEVEL),
  kind: z.enum(POTENTIAL_KINDS),
  soulStep: z.number().int().min(1).max(SOUL_STEPS.length),
  start: z.object({ main: potentialRollSchema, additional: potentialRollSchema, soul: potentialRollSchema }),
  goals: z.object({ main: goalField, additional: goalField, soul: goalField }),
  effects: z.boolean(),
});
export type PotentialSettings = z.infer<typeof potentialSettingsSchema>;

export const DEFAULT_POTENTIAL_SETTINGS: PotentialSettings = {
  item: null,
  part: 1,
  level: 200,
  kind: "main",
  soulStep: 1,
  start: {
    main: { grade: "rare", lines: [] },
    additional: { grade: "rare", lines: [] },
    soul: { grade: "rare", lines: [] },
  },
  goals: { main: DEFAULT_GOAL, additional: DEFAULT_GOAL, soul: DEFAULT_GOAL },
  effects: true,
};

export const TRIPLE_RESET_TIMES = 3;

export function tripleAllowed(kind: PotentialKind, grade: PotentialGrade, pity: number): boolean {
  const odds = upgradeOdds(kind, grade, pity);
  return odds === null || odds.ceiling - pity >= TRIPLE_RESET_TIMES;
}
