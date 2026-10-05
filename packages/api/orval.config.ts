import { defineConfig } from "orval";

const clean = !process.argv.includes("--watch");

export default defineConfig({
  nexon: {
    input: { target: "./openapi.yaml" },
    output: {
      target: "./src/generated/endpoints",
      schemas: "./src/generated/model",
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      clean,
      override: {
        mutator: { path: "./src/mutator.ts", name: "nexonFetch" },
        fetch: { includeHttpResponseReturnType: false },
        query: { useQuery: true, useSuspenseQuery: false, signal: false },
        useDates: false,
        enumGenerationType: "const",
      },
    },
  },
  nexonZod: {
    input: { target: "./openapi.yaml" },
    output: { client: "zod", mode: "tags-split", target: "./src/generated/zod", fileExtension: ".zod.ts", clean },
  },
});
