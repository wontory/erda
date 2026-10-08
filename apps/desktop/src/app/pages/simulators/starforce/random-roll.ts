import { PPM } from "@erda/core";

const LIMIT = Math.floor(0x1_0000_0000 / PPM) * PPM;

export function randomRoll(): number {
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < LIMIT) return buffer[0] % PPM;
  }
}
