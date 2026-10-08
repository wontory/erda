import type { CSSProperties } from "react";

// The in-game STARFORCE layout, drawn in the app's own tokens so it follows light and dark mode.
export const SF_THEME = {
  "--sf-edge": "var(--border)",
  "--sf-box": "color-mix(in oklab, var(--foreground) 4%, transparent)",
  "--sf-box-edge": "var(--border)",
  "--sf-pill": "color-mix(in oklab, var(--foreground) 7%, transparent)",
  "--sf-title": "var(--primary)",
  "--sf-text": "var(--foreground)",
  "--sf-muted": "var(--muted-foreground)",
  "--sf-gold": "var(--warning)",
  "--sf-danger": "var(--destructive)",
} as CSSProperties;

export const SF_PANEL =
  "rounded-2xl border border-(--sf-edge) bg-glass-card p-2 text-(--sf-text) shadow-[inset_0_1px_0_oklch(1_0_0/6%)]";

export const SF_TITLE = "m-0 px-1 text-[13px] font-semibold text-(--sf-text)";

export const SF_PILL = "rounded-full bg-(--sf-pill) px-3 py-1 text-center";
