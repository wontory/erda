import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 44100;
const out = process.env.OUT ?? dirname(fileURLToPath(import.meta.url));
const TAU = Math.PI * 2;

function buffer(seconds) {
  const n = Math.round(seconds * RATE);
  return { L: new Float32Array(n), R: new Float32Array(n), n };
}

function mix(buf, start, seconds, gain, pan, f) {
  const l = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const r = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  const i0 = Math.round(start * RATE);
  const len = Math.min(Math.round(seconds * RATE), buf.n - i0);
  for (let i = 0; i < len; i++) {
    const v = f(i / RATE);
    buf.L[i0 + i] += v * l;
    buf.R[i0 + i] += v * r;
  }
}

const attack = (t, a) => Math.min(1, t / a);

const modal =
  (f0, modes, atk = 0.0015) =>
  (t) => {
    let v = 0;
    for (const [mul, amp, decay] of modes) v += amp * Math.exp(-t * decay) * Math.sin(TAU * f0 * mul * t);
    return v * attack(t, atk);
  };

function reverb(buf, { room, damp, wet, width = 1, predelay = 0 }) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpasses = [556, 441, 341, 225];
  const spread = 23;
  const feedback = room * 0.28 + 0.7;
  const damping = damp * 0.4;
  const channel = (input, offset) => {
    const cs = combs.map((d) => ({ b: new Float32Array(d + offset), i: 0, store: 0 }));
    const as = allpasses.map((d) => ({ b: new Float32Array(d + offset), i: 0 }));
    const o = new Float32Array(input.length);
    for (let n = 0; n < input.length; n++) {
      const x = input[n] * 0.015;
      let y = 0;
      for (const c of cs) {
        const v = c.b[c.i];
        c.store = v * (1 - damping) + c.store * damping;
        c.b[c.i] = x + c.store * feedback;
        c.i = (c.i + 1) % c.b.length;
        y += v;
      }
      for (const a of as) {
        const v = a.b[a.i];
        a.b[a.i] = y + v * 0.5;
        a.i = (a.i + 1) % a.b.length;
        y = v - y;
      }
      o[n] = y;
    }
    return o;
  };
  const pre = Math.round(predelay * RATE);
  const delayed = (x) => {
    const o = new Float32Array(x.length);
    o.set(x.subarray(0, x.length - pre), pre);
    return o;
  };
  const wl = channel(delayed(buf.L), 0);
  const wr = channel(delayed(buf.R), spread);
  const w1 = wet * 3 * (width / 2 + 0.5);
  const w2 = wet * 3 * ((1 - width) / 2);
  const dry = 1 - wet * 0.5;
  for (let i = 0; i < buf.n; i++) {
    const l = buf.L[i];
    const r = buf.R[i];
    buf.L[i] = l * dry + wl[i] * w1 + wr[i] * w2;
    buf.R[i] = r * dry + wr[i] * w1 + wl[i] * w2;
  }
  return buf;
}

function pingPong(buf, { time, feedback, wet, tone = 0.35 }) {
  const d = Math.round(time * RATE);
  const lineL = new Float32Array(d);
  const lineR = new Float32Array(d);
  let i = 0;
  let lpL = 0;
  let lpR = 0;
  for (let n = 0; n < buf.n; n++) {
    const outL = lineL[i];
    const outR = lineR[i];
    lpL += tone * (outL - lpL);
    lpR += tone * (outR - lpR);
    lineL[i] = (buf.L[n] + buf.R[n]) * 0.5 + lpR * feedback;
    lineR[i] = lpL * feedback;
    buf.L[n] += outL * wet;
    buf.R[n] += outR * wet;
    i = (i + 1) % d;
  }
  return buf;
}

function finalize(buf, peakDb, tailFade = 0.05) {
  let peak = 0;
  for (let i = 0; i < buf.n; i++) peak = Math.max(peak, Math.abs(buf.L[i]), Math.abs(buf.R[i]));
  const g = peak > 0 ? 10 ** (peakDb / 20) / peak : 1;
  const fade = Math.round(tailFade * RATE);
  for (let i = 0; i < buf.n; i++) {
    const f = i > buf.n - fade ? (buf.n - i) / fade : 1;
    buf.L[i] *= g * f;
    buf.R[i] *= g * f;
  }
  return buf;
}

function wav(buf) {
  const pcm = Buffer.alloc(buf.n * 4);
  for (let i = 0; i < buf.n; i++) {
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf.L[i])) * 32767), i * 4);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf.R[i])) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const NOTE = {
  D3: 146.83,
  A3: 220,
  D4: 293.66,
  A4: 440,
  D5: 587.33,
  E5: 659.25,
  Fs5: 739.99,
  A5: 880,
  B5: 987.77,
  Cs6: 1108.73,
  D6: 1174.66,
  E6: 1318.51,
  Fs6: 1479.98,
  A6: 1760,
  B6: 1975.53,
  D7: 2349.32,
  E7: 2637.02,
  Fs7: 2959.96,
  A7: 3520,
};

const CHIME = [
  [1, 1, 1.4],
  [2.756, 0.46, 2.4],
  [5.404, 0.2, 4.2],
  [8.933, 0.08, 6.5],
];
function chime(b, at, f, gain, pan, sustain = 1, soft = 0) {
  const modes = CHIME.map(([mul, amp, decay], i) => [mul, amp * (1 - soft * Math.min(1, i * 0.45)), decay / sustain]);
  const atk = 0.002 + soft * 0.014;
  const len = Math.min(b.n / RATE - at, 4.5 * sustain + 0.3);
  mix(b, at, len, gain, pan, modal(f, modes, atk));
  mix(b, at, len, gain * 0.5, -pan * 0.7, modal(f * 1.0022, modes, atk));
  mix(b, at, 0.03, gain * 0.1 * (1 - soft), pan, modal(f * 12.6, [[1, 1, 320]], 0.0004));
}

function tick(f, peakDb) {
  const b = buffer(2.6);
  chime(b, 0, f, 0.5, -0.1, 0.55);
  return finalize(reverb(b, { room: 0.9, damp: 0.3, wet: 0.26, predelay: 0.03 }), peakDb, 0.8);
}

function finish() {
  const b = buffer(5.5);
  const strikes = [
    [0.0, NOTE.D6, 0.22, -0.35],
    [0.04, NOTE.A5, 0.2, 0.25],
    [0.08, NOTE.Fs6, 0.22, 0.4],
    [0.12, NOTE.A6, 0.21, -0.15],
    [0.17, NOTE.E6, 0.18, 0.1],
    [0.22, NOTE.D7, 0.2, -0.45],
    [0.36, NOTE.Fs6, 0.15, 0.3],
    [0.42, NOTE.A6, 0.15, -0.3],
    [0.48, NOTE.E7, 0.13, 0.45],
    [0.56, NOTE.Fs7, 0.11, -0.2],
  ];
  for (const [at, f, gain, pan] of strikes) chime(b, at, f, gain, pan, 1.15, 0.8);
  const pad = (f, rise, fall) => (t) => Math.sin(TAU * f * t) * (1 - Math.exp(-t / rise)) * Math.exp(-t / fall);
  [
    [NOTE.D5, -0.4],
    [NOTE.A5, 0.4],
    [NOTE.Fs6, -0.15],
    [NOTE.E6, 0.2],
  ].forEach(([f, pan]) => {
    mix(b, 0.02, 5.4, 0.05, pan, pad(f, 0.18, 1.6));
    mix(b, 0.02, 5.4, 0.03, -pan, pad(f * 1.003, 0.22, 1.5));
  });
  pingPong(b, { time: 0.2, feedback: 0.2, wet: 0.07 });
  return finalize(reverb(b, { room: 0.9, damp: 0.38, wet: 0.44, predelay: 0.02 }), -4, 1.6);
}

writeFileSync(join(out, "tick.wav"), wav(tick(NOTE.A5, -15)));
writeFileSync(join(out, "finish.wav"), wav(finish()));
console.log("tick.wav, finish.wav");
