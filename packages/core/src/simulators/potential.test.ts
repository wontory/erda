import { describe, expect, it } from "vitest";

import * as data from "./data/potential-tables.ts";
import {
  autoStep,
  canStartAuto,
  meetsTarget,
  tripleAllowed,
  choosePotential,
  initialPotentialState,
  lineGrade,
  lineTables,
  matchLines,
  meetsGoal,
  resetMeso,
  resetPotential,
  rollLines,
  statTotals,
  upgradeOdds,
  type LineTables,
  type PotentialGoal,
  type PotentialState,
  type PotentialTarget,
  type Rng,
} from "./potential.ts";
import { PPM } from "./starforce.ts";

const WEAPON_200: PotentialTarget = { kind: "main", part: 1, level: 200, soulStep: 1 };
const low: Rng = () => 0;
const high: Rng = (bound) => bound - 1;

function sequence(...values: number[]): Rng {
  let i = 0;
  return (bound) => Math.min(values[i++ % values.length], bound - 1);
}

const texts = (t: LineTables[number]) => t.map((e) => e.text);

describe("lineTables", () => {
  it("reads the official legendary weapon table and its level bands", () => {
    const at200 = lineTables(data, WEAPON_200, "legendary")!;
    expect(texts(at200[0])).toContain("보스 몬스터 데미지 +40%");
    expect(texts(at200[0])).toContain("공격력 +12%");
    const at250 = lineTables(data, { ...WEAPON_200, level: 250 }, "legendary")!;
    expect(texts(at250[0])).toContain("공격력 +13%");
  });

  it("keeps each line's weights near 100%", () => {
    for (const table of lineTables(data, WEAPON_200, "legendary")!) {
      const sum = table.reduce((s, e) => s + e.weight, 0);
      expect(Math.abs(sum - 10_000_000)).toBeLessThan(500);
    }
  });

  it("marks lower-grade options only on the second and third lines", () => {
    const [first, second, third] = lineTables(data, WEAPON_200, "legendary")!;
    expect(first.every((e) => !e.lower)).toBe(true);
    const lowerShare = (t: typeof second) => t.filter((e) => e.lower).reduce((s, e) => s + e.weight, 0) / 1e7;
    expect(lowerShare(second)).toBeCloseTo(0.8, 2);
    expect(lowerShare(third)).toBeCloseTo(0.95, 2);
  });

  it("uses the closest band below for levels without listed items", () => {
    const hat = { kind: "main", part: 6, level: 85, soulStep: 1 } as const;
    expect(lineTables(data, hat, "rare")).toEqual(lineTables(data, { ...hat, level: 80 }, "rare"));
  });

  it("has no table below a part's first listed level", () => {
    expect(lineTables(data, { kind: "main", part: 2, level: 30, soulStep: 1 }, "legendary")).toBeNull();
    expect(lineTables(data, { kind: "main", part: 2, level: 100, soulStep: 1 }, "legendary")).not.toBeNull();
  });

  it("offers soul potential only on weapons", () => {
    expect(lineTables(data, { kind: "soul", part: 6, level: 200, soulStep: 1 }, "rare")).toBeNull();
    expect(lineTables(data, { kind: "soul", part: 1, level: 200, soulStep: 4 }, "legendary")).not.toBeNull();
  });
});

describe("rollLines", () => {
  const entry = (text: string, weight = 1) => ({ text, lower: false, weight });

  it("allows at most one useful skill line", () => {
    const table = [entry("<쓸만한 헤이스트> 스킬 사용 가능", 1000), entry("STR +3")];
    const lines = rollLines([table, table, table], low);
    expect(lines.map((l) => l.text)).toEqual(["<쓸만한 헤이스트> 스킬 사용 가능", "STR +3", "STR +3"]);
  });

  it("allows at most two damage-ignore lines", () => {
    const table = [entry("피격 시 5% 확률로 데미지의 20% 무시", 1000), entry("STR +3")];
    const lines = rollLines([table, table, table], low);
    expect(lines.map((l) => l.text)).toEqual([
      "피격 시 5% 확률로 데미지의 20% 무시",
      "피격 시 5% 확률로 데미지의 20% 무시",
      "STR +3",
    ]);
  });

  it("never repeats the previous result", () => {
    const table = [entry("STR +3", 1000), entry("DEX +3")];
    const previous = rollLines([table, table, table], low);
    const next = rollLines([table, table, table], sequence(0, 0, 0, 0, 0, 1000), previous);
    expect(next).not.toEqual(previous);
  });
});

describe("costs and odds", () => {
  it("prices resets by level band and the grade before the reset", () => {
    expect(resetMeso(WEAPON_200, "legendary")).toBe(45_000_000);
    expect(resetMeso({ ...WEAPON_200, level: 159 }, "rare")).toBe(4_000_000);
    expect(resetMeso({ ...WEAPON_200, level: 250, kind: "additional" }, "unique")).toBe(83_300_000);
    expect(resetMeso({ ...WEAPON_200, kind: "soul" }, "epic")).toBe(40_000_000);
  });

  it("guarantees the upgrade on the ceiling attempt", () => {
    expect(upgradeOdds("main", "rare", 0)).toEqual({ ppm: 150_000, ceiling: 10, guaranteed: false });
    expect(upgradeOdds("main", "rare", 9)).toEqual({ ppm: PPM, ceiling: 10, guaranteed: true });
    expect(upgradeOdds("additional", "unique", 0)?.ppm).toBe(7_000);
    expect(upgradeOdds("main", "legendary", 0)).toBeNull();
  });
});

describe("resetPotential", () => {
  const start = (): PotentialState => initialPotentialState(data, WEAPON_200, { grade: "epic", lines: [] }, low)!;

  it("keeps BEFORE until AFTER is chosen", () => {
    const rolled = resetPotential(start(), data, WEAPON_200, high)!;
    expect(rolled.pending[0].upgraded).toBe(false);
    expect(rolled.current).toEqual(start().current);
    expect(choosePotential(rolled, "before").current).toEqual(start().current);
    expect(choosePotential(rolled, 0).current.lines).toEqual(rolled.pending[0].lines);
  });

  it("counts resets, upgrades, meso and the pity counter", () => {
    const failed = resetPotential(start(), data, WEAPON_200, high)!;
    expect(failed.pity).toBe(1);
    expect(failed.ledger).toEqual({ resets: 1, upgrades: 0, meso: 18_000_000n });
    const upgraded = resetPotential(failed, data, WEAPON_200, low)!;
    expect(upgraded.pending[0].grade).toBe("unique");
    expect(upgraded.pity).toBe(0);
    expect(upgraded.ledger).toEqual({ resets: 2, upgrades: 1, meso: 36_000_000n });
  });

  it("upgrades on the ceiling attempt even with a failing roll", () => {
    const state = { ...start(), pity: 41 };
    const r = resetPotential(state, data, WEAPON_200, high)!;
    expect(r.pending[0]).toMatchObject({ grade: "unique", upgraded: true, guaranteed: true });
  });

  it("rolls three results from BEFORE and charges for each", () => {
    const r = resetPotential(start(), data, WEAPON_200, high, 3)!;
    expect(r.pending).toHaveLength(3);
    expect(r.pending.every((p) => p.grade === "epic")).toBe(true);
    expect(r.pity).toBe(3);
    expect(r.ledger).toEqual({ resets: 3, upgrades: 0, meso: 54_000_000n });
    expect(choosePotential(r, 2).current.lines).toEqual(r.pending[2].lines);
    expect(choosePotential(r, "before").pending).toEqual([]);
  });

  it("counts the ceiling across the three results", () => {
    const r = resetPotential({ ...start(), pity: 40 }, data, WEAPON_200, high, 3)!;
    expect(r.pending.map((p) => p.grade)).toEqual(["epic", "unique", "epic"]);
    expect(r.pending[1].guaranteed).toBe(true);
    expect(r.pity).toBe(1);
  });
});

describe("auto targets", () => {
  const roll = {
    grade: "legendary",
    lines: [
      { text: "STR +12%", lower: false },
      { text: "올스탯 +9%", lower: false },
      { text: "STR +9%", lower: true },
    ],
  } as const;

  it("counts all stats toward each main stat", () => {
    const totals = statTotals(roll.lines);
    expect(totals.get("STR%")).toBe(30);
    expect(totals.get("DEX%")).toBe(9);
  });

  it("shows lower lines one grade down", () => {
    expect(lineGrade("legendary", roll.lines[2])).toBe("unique");
    expect(lineGrade("rare", { text: "STR +2", lower: true })).toBeNull();
  });

  it("stops when the result's sum per option reaches the target's sum", () => {
    expect(meetsTarget(roll.lines, ["STR +12%", "STR +9%", "STR +9%"])).toBe(true);
    expect(meetsTarget(roll.lines, ["STR +12%", "STR +12%", "STR +9%"])).toBe(false);
    expect(meetsTarget(roll.lines, ["DEX +9%", null, null])).toBe(true);
    expect(meetsTarget(roll.lines, ["공격력 +9%", null, null])).toBe(false);
    expect(meetsTarget(roll.lines, [null, null, null])).toBe(false);
  });

  it("needs options without values to appear as they are", () => {
    const lines = [
      { text: "<쓸만한 샤프 아이즈> 스킬 사용 가능", lower: false },
      { text: "STR +6", lower: false },
    ];
    expect(meetsTarget(lines, ["<쓸만한 샤프 아이즈> 스킬 사용 가능", null, null])).toBe(true);
    expect(meetsTarget(lines, ["<쓸만한 헤이스트> 스킬 사용 가능", null, null])).toBe(false);
  });

  it("stops on any of the targets", () => {
    const goal: PotentialGoal = {
      grade: "legendary",
      targets: [
        ["공격력 +12%", null, null],
        ["STR +12%", null, null],
      ],
    };
    expect(meetsGoal(roll, goal)).toBe(true);
    expect(meetsGoal(roll, { grade: "legendary", targets: [["공격력 +12%", null, null]] })).toBe(false);
  });

  it("checks every pending legendary result against the targets without choosing one", () => {
    const base: PotentialState = {
      current: { grade: "legendary", lines: [] },
      pending: [],
      pity: 0,
      ledger: { resets: 0, upgrades: 0, meso: 0n },
    };
    const goal: PotentialGoal = { grade: "legendary", targets: [["STR +12%", null, null]] };
    const plain = {
      grade: "legendary",
      lines: [{ text: "DEX +3%", lower: false }],
      upgraded: false,
      guaranteed: false,
    } as const;
    expect(autoStep({ ...base, pending: [plain] }, goal)).toMatchObject({ done: false });
    const hit = { ...base, pending: [plain, { ...roll, upgraded: false, guaranteed: false }] };
    expect(autoStep(hit, goal)).toEqual({ state: hit, done: true });
  });

  it("climbs toward the goal grade and stops there without choosing", () => {
    const base: PotentialState = {
      current: { grade: "rare", lines: [] },
      pending: [],
      pity: 0,
      ledger: { resets: 0, upgrades: 0, meso: 0n },
    };
    const goal: PotentialGoal = { grade: "unique", targets: [] };
    const epic = { grade: "epic", lines: [], upgraded: true, guaranteed: false } as const;
    const climbed = autoStep({ ...base, pending: [epic] }, goal);
    expect(climbed.done).toBe(false);
    expect(climbed.state.current.grade).toBe("epic");
    const unique = { grade: "unique", lines: [], upgraded: true, guaranteed: false } as const;
    const stopped = autoStep({ ...climbed.state, pending: [unique] }, goal);
    expect(stopped.done).toBe(true);
    expect(stopped.state.current.grade).toBe("epic");
  });

  it("climbs to legendary first when the goal has legendary targets", () => {
    const base: PotentialState = {
      current: { grade: "unique", lines: [] },
      pending: [],
      pity: 0,
      ledger: { resets: 0, upgrades: 0, meso: 0n },
    };
    const goal: PotentialGoal = { grade: "legendary", targets: [["STR +12%", null, null]] };
    const miss = {
      grade: "legendary",
      lines: [{ text: "DEX +3%", lower: false }],
      upgraded: true,
      guaranteed: false,
    } as const;
    const climbed = autoStep({ ...base, pending: [miss] }, goal);
    expect(climbed.done).toBe(false);
    expect(climbed.state.current.grade).toBe("legendary");
    const hit = { ...roll, upgraded: true, guaranteed: false };
    expect(autoStep({ ...base, pending: [hit] }, goal).done).toBe(true);
  });

  it("starts only with a higher goal grade or legendary targets", () => {
    expect(canStartAuto("rare", { grade: "rare", targets: [] })).toBe(false);
    expect(canStartAuto("rare", { grade: "epic", targets: [] })).toBe(true);
    expect(canStartAuto("legendary", { grade: "legendary", targets: [] })).toBe(false);
    expect(canStartAuto("legendary", { grade: "legendary", targets: [["STR +12%", null, null]] })).toBe(true);
    expect(canStartAuto("rare", { grade: "legendary", targets: [["STR +12%", null, null]] })).toBe(true);
  });
});

describe("tripleAllowed", () => {
  it("blocks three resets when the guaranteed upgrade is fewer than three resets away", () => {
    expect(tripleAllowed("main", "rare", 0)).toBe(true);
    expect(tripleAllowed("main", "rare", 7)).toBe(true);
    expect(tripleAllowed("main", "rare", 8)).toBe(false);
    expect(tripleAllowed("main", "legendary", 0)).toBe(true);
  });
});

describe("matchLines", () => {
  it("reads API option text and finds lower-grade lines", () => {
    const lines = matchLines(data, WEAPON_200, "legendary", ["보스 몬스터 데미지 : +40%", "STR +9%", null]);
    expect(lines).toEqual([
      { text: "보스 몬스터 데미지 +40%", lower: false },
      { text: "STR +9%", lower: true },
    ]);
    expect(matchLines(data, WEAPON_200, "legendary", [null, "STR +9%"])).toEqual([{ text: "STR +9%", lower: true }]);
  });
});
