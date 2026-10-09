import { useLayoutEffect, useRef } from "react";

export function useStableHeight<T extends HTMLElement>(resetKey: unknown) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.minHeight = "";
    let max = 0;
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
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
