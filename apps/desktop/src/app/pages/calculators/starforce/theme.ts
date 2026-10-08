import type { CSSProperties } from "react";

// Colors sampled from the in-game STARFORCE window. Fixed regardless of the app theme.
export const SF_THEME = {
  "--sf-window": "linear-gradient(180deg, #4d5a67 0%, #37424d 40%, #2a333c 100%)",
  "--sf-edge": "#71808e",
  "--sf-box": "rgba(14, 19, 25, 0.55)",
  "--sf-box-edge": "rgba(255, 255, 255, 0.08)",
  "--sf-pill": "rgba(10, 14, 19, 0.72)",
  "--sf-title": "#c8f04a",
  "--sf-text": "#f3f5f7",
  "--sf-muted": "#9aa5b0",
  "--sf-gold": "#ffcc33",
  "--sf-danger": "#ff6b5b",
  "--sf-button": "linear-gradient(180deg, #5a7f8b 0%, #35535e 100%)",
  "--sf-button-edge": "#a4c8d2",
} as CSSProperties;

export const SF_PANEL =
  "rounded-lg border border-(--sf-edge) bg-(image:--sf-window) p-2 text-(--sf-text) shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

export const SF_TITLE = "m-0 text-[12px] font-extrabold tracking-wide text-(--sf-title)";

export const SF_PILL = "rounded-full bg-(--sf-pill) px-3 py-1 text-center";
