import { useLayoutEffect, useRef } from "react";

// Holds an element at the tallest height it has reached, so content that
// varies from update to update (rolled text, wrapped lines) never pulls the
// controls below it up and down. Changing `resetKey` lets it shrink again.
export function useStableHeight<T extends HTMLElement>(resetKey: unknown) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.minHeight = "";
    let max = 0;
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      // A new width rewraps the content, so the old peak no longer applies.
      if (el.offsetWidth !== width) {
        width = el.offsetWidth;
        max = 0;
        el.style.minHeight = "";
      }
      const height = el.offsetHeight;
      if (height <= max) return;
      max = height;
      el.style.minHeight = `${height}px`;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [resetKey]);
  return ref;
}
