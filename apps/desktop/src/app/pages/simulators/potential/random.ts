import type { Rng } from "@erda/core";

export function randomSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}

export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return (bound) => {
    const limit = Math.floor(0x1_0000_0000 / bound) * bound;
    for (;;) {
      const value = next();
      if (value < limit) return value % bound;
    }
  };
}
