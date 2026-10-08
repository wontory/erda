import { describe, expect, it } from "vitest";

import { characterLookFrames } from "./look.ts";

const IMAGE = "https://open.api.nexon.com/static/maplestory/character/look/ABC";

describe("characterLookFrames", () => {
  it("bounces zigzag poses back through the middle frames", () => {
    expect(characterLookFrames(IMAGE, "A00", true).map((u) => new URL(u).searchParams.get("action"))).toEqual([
      "A00.0",
      "A00.1",
      "A00.2",
      "A00.1",
    ]);
  });

  it("loops other poses straight through", () => {
    expect(characterLookFrames(IMAGE, "A02", true)).toHaveLength(4);
  });

  it("keeps only the first frame when not animating", () => {
    expect(characterLookFrames(IMAGE, "A02", false)).toEqual([`${IMAGE}?action=A02.0`]);
  });

  it("replaces an existing action instead of appending one", () => {
    expect(characterLookFrames(`${IMAGE}?action=A01`, "A07", true)).toEqual([`${IMAGE}?action=A07.0`]);
  });

  it("returns nothing without an image", () => {
    expect(characterLookFrames("", "A00", true)).toEqual([]);
  });
});
