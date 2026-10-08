import type { EnhanceOutcome } from "@erda/core";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export interface SparkHandle {
  burst: (outcome: EnhanceOutcome) => void;
  charge: (on: boolean) => void;
}

type Kind = "spark" | "twinkle" | "shard" | "mote" | "dust";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  gravity: number;
}

const W = 280;
const H = 240;
const CX = W / 2;
const CY = H / 2 - 12;

const GOLD = ["#fff6d1", "#ffe08a", "#ffc83d", "#ffad1f"];
const ICE = ["#ffffff", "#cfe6ff", "#8fc6ff"];
const BLADE = ["#f4f8ff", "#c9d6ee", "#9fb4d6", "#7d93ba", "#ffc93c"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

function radial(kind: Kind, speed: [number, number], life: [number, number], extra: Partial<Particle>): Particle {
  const angle = rand(0, Math.PI * 2);
  const v = rand(...speed);
  return {
    kind,
    x: CX,
    y: CY,
    vx: Math.cos(angle) * v,
    vy: Math.sin(angle) * v,
    life: 0,
    max: rand(...life),
    size: 2,
    color: "#fff",
    rot: rand(0, Math.PI * 2),
    vr: 0,
    gravity: 0,
    ...extra,
  };
}

function spawn(outcome: EnhanceOutcome): Particle[] {
  const out: Particle[] = [];
  if (outcome === "success") {
    for (let i = 0; i < 44; i++) {
      out.push(radial("spark", [140, 360], [0.55, 1.05], { size: rand(1.2, 2.4), color: pick(GOLD), gravity: 520 }));
    }
    for (let i = 0; i < 9; i++) {
      const p = radial("twinkle", [20, 70], [0.6, 0.95], { size: rand(4, 7.5), color: pick(GOLD) });
      p.x += p.vx * 0.35;
      p.y += p.vy * 0.35;
      out.push(p);
    }
  } else if (outcome === "protected") {
    for (let i = 0; i < 22; i++) {
      out.push(radial("spark", [90, 220], [0.4, 0.7], { size: rand(1, 1.8), color: pick(ICE), gravity: 200 }));
    }
  } else if (outcome === "destroyed") {
    for (let i = 0; i < 16; i++) {
      out.push(
        radial("shard", [90, 240], [0.9, 1.35], {
          size: rand(3, 6.5),
          color: pick(BLADE),
          gravity: 680,
          vr: rand(-10, 10),
        }),
      );
    }
    for (let i = 0; i < 14; i++) {
      out.push(radial("dust", [20, 80], [0.7, 1.1], { size: rand(6, 12), color: "#6b7280", gravity: -30 }));
    }
  } else {
    for (let i = 0; i < 10; i++) {
      out.push(radial("dust", [15, 55], [0.45, 0.7], { size: rand(4, 8), color: "#9ca3af", gravity: 60 }));
    }
  }
  return out;
}

function mote(): Particle {
  const angle = rand(0, Math.PI * 2);
  const r = rand(70, 105);
  const t = rand(0.45, 0.7);
  return {
    kind: "mote",
    x: CX + Math.cos(angle) * r,
    y: CY + Math.sin(angle) * r,
    vx: (-Math.cos(angle) * r) / t,
    vy: (-Math.sin(angle) * r) / t,
    life: 0,
    max: t,
    size: rand(1.2, 2.2),
    color: pick(GOLD),
    rot: 0,
    vr: 0,
    gravity: 0,
  };
}

function star(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.22;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, p: Particle) {
  const t = p.life / p.max;
  const fade = 1 - t;
  ctx.save();
  switch (p.kind) {
    case "spark": {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = fade;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
      ctx.stroke();
      break;
    }
    case "mote": {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.sin(t * Math.PI);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "twinkle": {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.sin(t * Math.PI);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + t * 1.2);
      star(ctx, p.size * (0.6 + Math.sin(t * Math.PI) * 0.6));
      break;
    }
    case "shard": {
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "#141a2a";
      ctx.lineWidth = 1;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.8, p.size * 0.6);
      ctx.lineTo(-p.size * 0.7, p.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "dust": {
      ctx.globalAlpha = fade * 0.35;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.8), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

class SparkEngine {
  private particles: Particle[] = [];
  private charging = false;
  private frame: number | null = null;
  private last = 0;

  private readonly ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  burst(outcome: EnhanceOutcome) {
    this.particles.push(...spawn(outcome));
    this.start();
  }

  charge(on: boolean) {
    this.charging = on;
    if (on) this.start();
  }

  dispose() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private start() {
    if (this.frame !== null) return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    if (this.charging) {
      this.particles.push(mote());
      if (Math.random() < 0.4) this.particles.push(mote());
    }
    this.ctx.clearRect(0, 0, W, H);
    this.particles = this.particles.filter((p) => {
      p.life += dt;
      if (p.life >= p.max) return false;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.kind === "spark" || p.kind === "dust") {
        p.vx *= 1 - 1.6 * dt;
        p.vy *= 1 - 0.6 * dt;
      }
      draw(this.ctx, p);
      return true;
    });
    this.frame = this.particles.length > 0 || this.charging ? requestAnimationFrame(this.tick) : null;
  };
}

export function SparkCanvas({ ref, disabled }: { ref: Ref<SparkHandle>; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<SparkEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const created = new SparkEngine(ctx);
    engine.current = created;
    return () => {
      created.dispose();
      engine.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      burst: (outcome) => {
        if (!disabled) engine.current?.burst(outcome);
      },
      charge: (on) => engine.current?.charge(on && !disabled),
    }),
    [disabled],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 z-10"
      style={{ width: W, height: H, marginLeft: -W / 2, marginTop: -H / 2 + 12 }}
    />
  );
}
