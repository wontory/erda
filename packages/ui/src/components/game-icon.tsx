import { cn } from "cn";

import { useImageStatus } from "#/hooks/use-image-status.ts";

type GameIconProps = {
  src: string | null | undefined;
  size: number;
  alt?: string;
  className?: string;
};

export function GameIcon({ src, size, alt = "", className }: GameIconProps) {
  const image = useImageStatus(src);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {src && !image.failed ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          decoding="async"
          className={cn(
            "max-h-full max-w-full object-contain transition-opacity duration-150 ease-out [image-rendering:pixelated] motion-reduce:transition-none",
            image.loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={image.onLoad}
          onError={image.onError}
        />
      ) : null}
    </span>
  );
}
