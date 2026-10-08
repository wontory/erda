// A flat, two-tone sword drawn with the app's tokens so it sits with the lucide icons around it.
const INK = "color-mix(in oklab, var(--foreground) 72%, transparent)";
const TINT = "color-mix(in oklab, var(--foreground) 7%, transparent)";
const RIDGE = "color-mix(in oklab, var(--foreground) 22%, transparent)";
const GOLD = "var(--sf-gold)";
const GOLD_TINT = "color-mix(in oklab, var(--sf-gold) 22%, transparent)";

export function ItemArt({ destroyed }: { destroyed: boolean }) {
  const blade = destroyed
    ? "M29 30 L31.5 27.5 L33.5 30 L35.5 26.5 L38.5 29.5 L38.5 40 L29 40 Z"
    : "M33.75 6 L38.5 13 L38.5 40 L29 40 L29 13 Z";
  return (
    <svg
      viewBox="10 8 48 52"
      className={`size-14 transition-opacity duration-300 ${destroyed ? "opacity-45" : ""}`}
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <g transform="rotate(-40 34 34)">
        <path d={blade} fill={TINT} stroke={INK} />
        {destroyed ? null : <path d="M33.75 10 L33.75 37" stroke={RIDGE} />}
        <path d="M22.5 40 L45 40 L45 43.5 L22.5 43.5 Z" fill={GOLD_TINT} stroke={GOLD} />
        <path d="M31.5 43.5 L36 43.5 L36 54 L31.5 54 Z" fill={TINT} stroke={INK} />
        <circle cx="33.75" cy="57" r="2.4" fill={GOLD_TINT} stroke={GOLD} />
      </g>
    </svg>
  );
}
