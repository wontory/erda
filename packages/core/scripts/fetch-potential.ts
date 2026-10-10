import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://maplestory.nexon.com/Guide/OtherProbability/cube/";
const RESET_ITEMS = { main: 5062010, additional: 5062500, gold: 2711004, silver: 2711003, bronze: 2730002 } as const;
const MAX_GRADES: Record<keyof typeof RESET_ITEMS, number> = { main: 4, additional: 4, gold: 4, silver: 3, bronze: 2 };
const GRADES = [1, 2, 3, 4];
const gradesOf = (table: keyof typeof RESET_ITEMS) => GRADES.filter((g) => g <= MAX_GRADES[table]);
const PARTS = Array.from({ length: 20 }, (_, i) => i + 1);
const SOUL_STEPS = [1, 2, 3, 4];
const LEVELS = [...new Set([0, 1, ...Array.from({ length: 26 }, (_, d) => [d * 10, d * 10 + 1]).flat()])]
  .filter((l) => l <= 250)
  .toSorted((a, b) => a - b);
const CONCURRENCY = 4;

const here = fileURLToPath(new URL(".", import.meta.url));
const out = join(here, "..", "src", "simulators", "data", "potential-tables.ts");
const cacheDir = process.env.POTENTIAL_CACHE;

type Row = readonly [text: string, percent: number];
type Lines = readonly Row[][];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(path: string, data: Record<string, number>): Promise<string> {
  const key = `${path}_${Object.entries(data)
    .map(([k, v]) => `${k}${v}`)
    .join("_")}.html`;
  const cached = cacheDir ? join(cacheDir, key) : null;
  if (cached && existsSync(cached)) return readFileSync(cached, "utf8");
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" },
        body: new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
      if (!res.ok) throw new Error(`${res.status} ${key}`);
      const body = await res.text();
      if (cached) {
        mkdirSync(cacheDir!, { recursive: true });
        writeFileSync(cached, body);
      }
      await sleep(150);
      return body;
    } catch (e) {
      if (attempt >= 3) throw e;
      await sleep(2000 + attempt * 3000);
    }
  }
}

const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();

function parse(body: string): Lines {
  return [...body.matchAll(/<table class="cube_data[\s\S]*?<\/table>/g)].map(([table]) =>
    [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
      .map(([, tr]) => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(([, c]) => decode(c)))
      .slice(1)
      .filter((cells) => cells.length >= 2 && cells[1].endsWith("%"))
      .map(([text, pct]) => [text, Number(pct.replace("%", ""))] as const),
  );
}

async function pool<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
        if (++done % 500 === 0) console.log(`${done}/${items.length}`);
      }
    }),
  );
  return results;
}

const options: string[] = [];
const optionIndex = new Map<string, number>();
const tables: number[][] = [];
const tableIndex = new Map<string, number>();

function optionId(text: string): number {
  let id = optionIndex.get(text);
  if (id === undefined) {
    id = options.push(text) - 1;
    optionIndex.set(text, id);
  }
  return id;
}

function tableId(rows: readonly Row[], primeCount: number): number {
  const lowerCount = rows.length - primeCount;
  const flat = rows.flatMap(([text, pct], i) => [optionId(text) * 2 + (i < lowerCount ? 1 : 0), Math.round(pct * 1e5)]);
  const key = flat.join(",");
  let id = tableIndex.get(key);
  if (id === undefined) {
    id = tables.push(flat) - 1;
    tableIndex.set(key, id);
  }
  return id;
}

function encodeLines(lines: Lines): [number, number, number] | null {
  if (lines.length !== 3) return null;
  const first = lines[0].map(([t]) => t);
  for (const line of lines.slice(1)) {
    const tail = line.slice(-first.length).map(([t]) => t);
    if (tail.join("\n") !== first.join("\n")) throw new Error("line table does not end with the first line's options");
  }
  return [tableId(lines[0], first.length), tableId(lines[1], first.length), tableId(lines[2], first.length)];
}

type Band = [minLevel: number, line1: number, line2: number, line3: number];

async function main() {
  const jobs = Object.entries(RESET_ITEMS).flatMap(([table, item]) =>
    gradesOf(table as keyof typeof RESET_ITEMS).flatMap((grade) =>
      PARTS.flatMap((part) => LEVELS.map((level) => ({ item, grade, part, level }))),
    ),
  );
  const pages = await pool(jobs, (j) =>
    post("GetSearchProbList", { nCubeItemID: j.item, nGrade: j.grade, nPartsType: j.part, nReqLev: j.level }),
  );
  const parsed = new Map(jobs.map((j, i) => [`${j.item}/${j.grade}/${j.part}/${j.level}`, parse(pages[i])]));

  const bands = Object.fromEntries(
    Object.entries(RESET_ITEMS).map(([table, item]) => [
      table,
      PARTS.map((part) =>
        gradesOf(table as keyof typeof RESET_ITEMS).map((grade) => {
          const list: Band[] = [];
          for (const level of LEVELS) {
            const ids = encodeLines(parsed.get(`${item}/${grade}/${part}/${level}`)!);
            if (!ids) continue;
            const prev = list.at(-1);
            if (prev && prev.slice(1).join() === ids.join()) continue;
            list.push([level, ...ids]);
          }
          return list;
        }),
      ),
    ]),
  );

  const soul = await Promise.all(
    GRADES.map((grade) =>
      Promise.all(
        SOUL_STEPS.map(async (step) => {
          const ids = encodeLines(parse(await post("GetSoulPotentialProbList", { nGrade: grade, nLevel: step })));
          if (!ids) throw new Error(`no soul table for grade ${grade} step ${step}`);
          return ids;
        }),
      ),
    ),
  );

  const date = new Date().toISOString().slice(0, 10);
  const body = [
    `import type { PotentialTable } from "#/simulators/data/potential-rules.ts";`,
    "",
    `export const POTENTIAL_DATA_DATE = "${date}";`,
    `export const POTENTIAL_OPTIONS: readonly string[] = ${JSON.stringify(options)};`,
    `export const POTENTIAL_TABLES: readonly (readonly number[])[] = ${JSON.stringify(tables)};`,
    `export const POTENTIAL_BANDS: Readonly<Record<PotentialTable, readonly (readonly (readonly (readonly number[])[])[])[]>> = ${JSON.stringify(bands)};`,
    `export const SOUL_POTENTIAL_TABLES: readonly (readonly (readonly number[])[])[] = ${JSON.stringify(soul)};`,
    "",
  ].join("\n");
  writeFileSync(out, body);
  console.log(`wrote ${options.length} options, ${tables.length} tables to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
