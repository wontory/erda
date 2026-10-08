import { m } from "motion/react";
import { useId } from "react";

// A game-icon style sword: dark outline, layered gradients, a gem in the guard and a periodic glint.
export function ItemArt({ destroyed }: { destroyed: boolean }) {
  const id = useId().replace(/:/g, "");
  const blade = `${id}-blade`;
  const edge = `${id}-edge`;
  const gold = `${id}-gold`;
  const gem = `${id}-gem`;
  const grip = `${id}-grip`;
  const glint = `${id}-glint`;
  const clip = `${id}-clip`;
  const bladePath = destroyed
    ? "M28.5 30 L31.5 27 L33.5 29.5 L35.5 26 L37.5 28.5 L39 30 L39 41 L28.5 41 Z"
    : "M33.75 4 L39 12 L39 41 L28.5 41 L28.5 12 Z";

  return (
    <svg
      viewBox="10 8 48 52"
      className={`size-[68px] drop-shadow-[0_3px_4px_rgb(0_0_0/0.35)] ${destroyed ? "opacity-55 grayscale" : ""}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={blade} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9fb4d6" />
          <stop offset="0.48" stopColor="#f4f8ff" />
          <stop offset="0.52" stopColor="#c9d6ee" />
          <stop offset="1" stopColor="#7d93ba" />
        </linearGradient>
        <linearGradient id={edge} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={gold} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.45" stopColor="#ffc93c" />
          <stop offset="1" stopColor="#c47a10" />
        </linearGradient>
        <radialGradient id={gem} cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffd6e4" />
          <stop offset="0.35" stopColor="#ff4d7d" />
          <stop offset="1" stopColor="#8a0f3a" />
        </radialGradient>
        <linearGradient id={grip} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3b2a5c" />
          <stop offset="0.5" stopColor="#6a4fa3" />
          <stop offset="1" stopColor="#2c1f47" />
        </linearGradient>
        <linearGradient id={glint} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={bladePath} />
        </clipPath>
      </defs>

      <g transform="rotate(-38 34 34)" stroke="#141a2a" strokeWidth="1.6" strokeLinejoin="round">
        {/* blade */}
        <path d={bladePath} fill={`url(#${blade})`} />
        {destroyed ? null : <path d="M33.75 6.5 L33.75 39" stroke={`url(#${edge})`} strokeWidth="1" />}
        {destroyed ? null : (
          <g clipPath={`url(#${clip})`} stroke="none">
            <m.rect
              x="20"
              width="9"
              height="60"
              y="-4"
              fill={`url(#${glint})`}
              transform="skewX(-20)"
              initial={{ x: -8 }}
              animate={{ x: [-8, 34] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.2, ease: [0.65, 0, 0.35, 1] }}
            />
          </g>
        )}
        {/* guard */}
        <path
          d="M20 41.5 Q25 38.5 33.75 40 Q42.5 38.5 47.5 41.5 Q44 45.5 39 45 L28.5 45 Q23.5 45.5 20 41.5 Z"
          fill={`url(#${gold})`}
        />
        <circle cx="33.75" cy="42.5" r="3.4" fill={`url(#${gem})`} />
        <circle cx="32.7" cy="41.4" r="0.9" fill="#ffffff" stroke="none" opacity="0.9" />
        {/* grip */}
        <rect x="31.25" y="45" width="5" height="11" rx="1.2" fill={`url(#${grip})`} />
        <path
          d="M31.5 48 L36.5 47 M31.5 51 L36.5 50 M31.5 54 L36.5 53"
          stroke="#c9b4ff"
          strokeWidth="0.8"
          opacity="0.7"
        />
        {/* pommel */}
        <circle cx="33.75" cy="58.5" r="2.8" fill={`url(#${gold})`} />
      </g>
    </svg>
  );
}
