import { cn } from "cn";
import { User } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { imageA11y } from "#/lib/a11y.ts";
import { spriteFetcher } from "#/lib/sprite-fetcher.ts";

const IMAGE = 300;
const ANCHOR_X = 147;
const FEET_Y = 200;
const BODY_HALF = 40;
const MIN_SPAN = 80;
const PAD = 6;
const FALLBACK: Fit = { cx: ANCHOR_X, cy: 160, span: 96 };

type Fit = { cx: number; cy: number; span: number };
type Loaded = { key: string; images: ImageBitmap[]; fit: Fit } | { key: string; failed: true };

async function fetchBitmap(src: string): Promise<ImageBitmap> {
  const fetcher = spriteFetcher();
  if (fetcher) return createImageBitmap(new Blob([await fetcher(src)]));
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  return createImageBitmap(img);
}

function loadImage(src: string): Promise<ImageBitmap | null> {
  return fetchBitmap(src).then(
    (bitmap) => (bitmap.width === IMAGE ? bitmap : null),
    () => null,
  );
}

function measureFit(images: ImageBitmap[]): Fit {
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE;
  canvas.height = IMAGE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return FALLBACK;
  let top = FEET_Y;
  try {
    for (const img of images) {
      ctx.clearRect(0, 0, IMAGE, IMAGE);
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(ANCHOR_X - BODY_HALF, 0, BODY_HALF * 2, FEET_Y);
      const opaque = data.findIndex((v, i) => i % 4 === 3 && v >= 40);
      if (opaque >= 0) top = Math.min(top, Math.floor(opaque / 4 / (BODY_HALF * 2)));
    }
  } catch {
    return FALLBACK;
  }
  if (top >= FEET_Y) return FALLBACK;
  const span = Math.max(MIN_SPAN, FEET_Y - top + 1 + PAD * 2);
  return { cx: ANCHOR_X, cy: (top + FEET_Y + 1) / 2, span };
}

function useFrames(frames: readonly string[], fallback: string) {
  const key = [fallback, ...frames].join("\n");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [plain = "", ...srcs] = key.split("\n");
      const images: ImageBitmap[] = [];
      for (const src of srcs.filter(Boolean)) {
        const img = await loadImage(src);
        if (cancelled) return;
        if (img) images.push(img);
      }
      if (images.length === 0 && plain && !srcs.includes(plain)) {
        const img = await loadImage(plain);
        if (cancelled) return;
        if (img) images.push(img);
      }
      if (images.length === 0) return setLoaded({ key, failed: true });
      setLoaded({ key, images, fit: measureFit(images) });
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return loaded?.key === key ? loaded : null;
}

type SpriteProps = {
  src: string;
  size: number;
  zoom?: number;
  alt?: string;
  className?: string;
  frames?: readonly string[];
  frameMs?: number;
};

export function Sprite({ src, size, zoom = 1, alt = "", className, frames, frameMs = 0 }: SpriteProps) {
  const a11y = imageA11y(alt);
  const reduced = useReducedMotion() ?? false;
  const list = frames?.length ? frames : [src];
  const loaded = useFrames(reduced ? list.slice(0, 1) : list, src);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = loaded && "images" in loaded ? loaded.images : null;
  const fit = loaded && "fit" in loaded ? loaded.fit : FALLBACK;

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !images) return;
    const px = el.width;
    const k = (px / fit.span) * zoom;
    const draw = (i: number) => {
      const img = images[i % images.length];
      if (!img) return;
      ctx.clearRect(0, 0, px, px);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, px / 2 - fit.cx * k, px / 2 - fit.cy * k, IMAGE * k, IMAGE * k);
    };
    draw(0);
    if (images.length < 2 || frameMs <= 0) return;
    let i = 0;
    const id = window.setInterval(() => draw(++i), frameMs);
    return () => window.clearInterval(id);
  }, [images, fit, zoom, frameMs, size]);

  if (!src || (loaded && "failed" in loaded)) {
    return (
      <span
        {...a11y}
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-muted-foreground/40",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <User size={size * 0.5} />
      </span>
    );
  }
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  return (
    <span
      {...a11y}
      className={cn(
        "inline-block shrink-0 overflow-hidden rounded-lg transition-opacity duration-150 ease-out motion-reduce:transition-none",
        images ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <canvas ref={canvas} width={size * dpr} height={size * dpr} className="block size-full" />
    </span>
  );
}
