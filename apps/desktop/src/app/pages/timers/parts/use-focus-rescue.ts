import { useRef, type FocusEvent } from "react";

export function moduleHeading(el: Element | null): HTMLElement | null {
  const h = el?.closest("section")?.querySelector<HTMLElement>("h2") ?? null;
  if (h && !h.hasAttribute("tabindex")) h.tabIndex = -1;
  return h;
}

export function useFocusRescue() {
  const listRef = useRef<HTMLDivElement>(null);
  const lastIndex = useRef<number | null>(null);
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const row = (e.target as Element).closest("[data-row]");
    lastIndex.current = row ? Array.from(e.currentTarget.querySelectorAll("[data-row]")).indexOf(row) : null;
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) lastIndex.current = null;
  };
  const rescue = () => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      const index = lastIndex.current;
      const active = document.activeElement;
      if (!list || index === null || (active && active !== document.body)) return;
      lastIndex.current = null;
      const rows = list.querySelectorAll("[data-row]");
      const row = rows[Math.min(index, rows.length - 1)];
      (row?.querySelector<HTMLElement>("[data-row-focus]") ?? moduleHeading(list))?.focus();
    });
  };
  return { listRef, listProps: { ref: listRef, onFocus, onBlur }, rescue };
}
