export function applySystemTheme(isDark: boolean, root: HTMLElement = document.documentElement) {
  if (root.classList.contains("dark") === isDark) return;
  const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
  if (raf) root.classList.add("no-transitions");
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
  if (raf) raf(() => raf(() => root.classList.remove("no-transitions")));
}

export function startSystemTheme() {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  applySystemTheme(media.matches);
  media.addEventListener("change", (e) => applySystemTheme(e.matches));
}
