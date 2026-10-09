import { invoke } from "@tauri-apps/api/core";
import { useEffect, type RefObject } from "react";

export function useFitWindowHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = 0;
    const observer = new ResizeObserver(() => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height <= 0 || height === last) return;
      last = height;
      void invoke("window_fit", { height }).catch(console.error);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}
