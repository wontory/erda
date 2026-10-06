import { focusScreenTitle } from "@erda/ui/lib/screen-title";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { useNav } from "./context.ts";

const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

type FocusMark = { index: number; label: string };

const labelOf = (el: Element) => el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "";

const pageEl = (main: HTMLElement | null, id: string) =>
  main?.querySelector<HTMLElement>(`[data-page="${CSS.escape(id)}"]`) ?? null;

function focusMarkIn(page: HTMLElement | null): FocusMark | null {
  const active = document.activeElement;
  if (!page || !active || !page.contains(active)) return null;
  const index = Array.from(page.querySelectorAll(FOCUSABLE)).indexOf(active);
  return index >= 0 ? { index, label: labelOf(active) } : null;
}

function findMarked(page: HTMLElement, mark: FocusMark): HTMLElement | undefined {
  const list = Array.from(page.querySelectorAll<HTMLElement>(FOCUSABLE));
  const at = list[mark.index];
  return at && labelOf(at) === mark.label ? at : list.find((x) => labelOf(x) === mark.label);
}

function pruneTo(alive: Set<string>, ...maps: Map<string, unknown>[]) {
  for (const map of maps) {
    for (const id of map.keys()) if (!alive.has(id)) map.delete(id);
  }
}

export function useScreenMemory(mainRef: RefObject<HTMLElement | null>, viewportRef: RefObject<HTMLDivElement | null>) {
  const { current, stack, direction, via } = useNav();
  const scrollTops = useRef(new Map<string, number>());
  const focusMarks = useRef(new Map<string, FocusMark>());
  const currentId = useRef(current.id);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onScroll = () => scrollTops.current.set(currentId.current, vp.scrollTop);
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, [viewportRef]);

  useLayoutEffect(() => {
    const prevId = currentId.current;
    if (prevId === current.id) return;
    currentId.current = current.id;
    if (direction === "forward") {
      const mark = focusMarkIn(pageEl(mainRef.current, prevId));
      if (mark) focusMarks.current.set(prevId, mark);
    }
    pruneTo(new Set(stack.map((p) => p.id)), scrollTops.current, focusMarks.current);
    const vp = viewportRef.current;
    if (!vp) return;
    const restoreScroll = direction === "back" && via !== "restore";
    vp.scrollTop = restoreScroll ? (scrollTops.current.get(current.id) ?? 0) : 0;
  }, [current.id, direction, via, stack, mainRef, viewportRef]);

  useEffect(() => {
    if (via === "restore") return;
    const el = pageEl(mainRef.current, current.id);
    if (!el) return;
    const mark = direction === "back" ? focusMarks.current.get(current.id) : undefined;
    if (mark) {
      const target = findMarked(el, mark);
      focusMarks.current.delete(current.id);
      if (target) {
        target.focus({ preventScroll: true });
        return;
      }
    }
    focusScreenTitle(el);
  }, [current.id, direction, via, mainRef]);
}
