import type { CSSProperties } from "react";

// Starforce accents mapped onto the app's tokens so they follow light and dark mode.
export const SF_THEME = {
  "--sf-text": "var(--foreground)",
  "--sf-gold": "var(--warning)",
  "--sf-danger": "var(--destructive)",
} as CSSProperties;
