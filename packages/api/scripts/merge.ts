import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse, stringify } from "yaml";

type AnyRecord = Record<string, any>;

const API_KEY_HEADER = "x-nxopen-api-key";

const PATCHES: Array<[schema: string, property: string]> = [
  ["CharacterPetEquipment", "world_share_pet_equipment_preset"],
];

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

export function operationIdFor(path: string): string {
  const parts = path
    .replace(/^\/maplestory\//, "")
    .split("/")
    .filter((p) => p && p !== "v1");
  const words = parts.flatMap((p) => p.split("-"));
  return "get" + words.map(capitalize).join("");
}

function normalizeOperation(path: string, item: AnyRecord): AnyRecord {
  const op = structuredClone(item.get);
  op.operationId = operationIdFor(path);
  op.parameters = (op.parameters ?? []).filter((p: AnyRecord) => p.name !== API_KEY_HEADER);
  for (const p of op.parameters) {
    if (p.in === "query" && p.schema?.type === "number") p.schema.type = "integer";
  }
  return op;
}

export function mergeSpecs(specs: AnyRecord[]): AnyRecord {
  const out: AnyRecord = {
    openapi: "3.0.3",
    info: {
      title: "MapleStory Nexon Open API (merged)",
      version: "1.0.0",
      description:
        "Merged from https://openapi.nexon.com/static/api/maplestory/ specs. API key header is injected by the Rust gateway.",
    },
    servers: [{ url: "https://open.api.nexon.com" }],
    paths: {},
    components: { schemas: {} },
  };

  for (const spec of specs) {
    for (const [path, item] of Object.entries<AnyRecord>(spec.paths ?? {})) {
      if (out.paths[path]) throw new Error(`duplicate path ${path}`);
      out.paths[path] = { get: normalizeOperation(path, item) };
    }
    for (const [name, schema] of Object.entries<AnyRecord>(spec.components?.schemas ?? {})) {
      out.components.schemas[name] ??= structuredClone(schema);
    }
  }

  for (const [schema, property] of PATCHES) {
    delete out.components.schemas[schema]?.properties?.[property];
  }
  return out;
}

export function mergeSpecFiles(dir: string, target: string) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .toSorted();
  const merged = mergeSpecs(files.map((f) => parse(readFileSync(join(dir, f), "utf8"))));
  writeFileSync(target, stringify(merged, { lineWidth: 0 }));
  return { paths: Object.keys(merged.paths).length, schemas: Object.keys(merged.components.schemas).length };
}

const here = fileURLToPath(new URL(".", import.meta.url));
const isMain = process.argv[1] && fileURLToPath(new URL(`file://${process.argv[1]}`)) === join(here, "merge.ts");
if (isMain) {
  const result = mergeSpecFiles(join(here, "..", "specs"), join(here, "..", "openapi.yaml"));
  console.log(`openapi.yaml: ${result.paths} paths, ${result.schemas} schemas`);
}
