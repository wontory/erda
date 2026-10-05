import { cn } from "cn";
import { User } from "lucide-react";

import { useImageStatus } from "#/hooks/use-image-status.ts";
import { imageA11y } from "#/lib/a11y.ts";

const IMAGE = 300;
const FRAME = { x: 92, y: 110, w: 112, h: 110 };

function spriteStyle(size: number, zoom: number) {
  const k = (size / FRAME.w) * zoom;
  const cx = FRAME.x + FRAME.w / 2;
  const cy = FRAME.y + FRAME.h / 2;
  return {
    width: size,
    height: size,
    backgroundSize: `${IMAGE * k}px ${IMAGE * k}px`,
    backgroundPosition: `${size / 2 - cx * k}px ${size / 2 - cy * k}px`,
  };
}

type SpriteProps = {
  src: string;
  size: number;
  zoom?: number;
  alt?: string;
  className?: string;
};

export function Sprite({ src, size, zoom = 1, alt = "", className }: SpriteProps) {
  const image = useImageStatus(src);
  const a11y = imageA11y(alt);
  if (image.failed) {
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
  return (
    <span
      {...a11y}
      className={cn(
        "inline-block shrink-0 overflow-hidden rounded-lg bg-no-repeat transition-opacity duration-150 ease-out [image-rendering:pixelated] motion-reduce:transition-none",
        image.loaded ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ ...spriteStyle(size, zoom), backgroundImage: `url("${src}")` }}
    >
      <img src={src} alt="" className="hidden" onLoad={image.onLoad} onError={image.onError} />
    </span>
  );
}
