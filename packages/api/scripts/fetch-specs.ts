import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://openapi.nexon.com/";
const DOCS_PAGES = [14, 15, 16, 17, 18, 27, 59, 62].map((id) => `${BASE}ko/game/maplestory/?id=${id}`);
const SPEC_LINK = /static\/api\/maplestory\/[^"']+\.yaml/g;
const here = fileURLToPath(new URL(".", import.meta.url));
const dir = join(here, "..", "specs");

const fetchText = async (url: string) => (await fetch(url)).text();

async function findSpecLinks(): Promise<string[]> {
  const links = new Set<string>();
  for (const page of DOCS_PAGES) {
    const html = await fetchText(page);
    for (const m of html.matchAll(SPEC_LINK)) links.add(m[0]);
  }
  return [...links].toSorted();
}

function clearDir() {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) rmSync(join(dir, f));
}

async function main() {
  const links = await findSpecLinks();
  if (links.length === 0) throw new Error("no spec links found; the docs page layout may have changed");
  clearDir();
  for (const link of links) {
    const name = link.split("/").pop()!;
    const body = await fetchText(BASE + link);
    writeFileSync(join(dir, name), body);
    console.log(`saved ${name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
