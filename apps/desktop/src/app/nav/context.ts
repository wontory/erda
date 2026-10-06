import { createContext, useContext } from "react";

import type { Page } from "./stack.ts";

export type NavVia = "pointer" | "keyboard" | "restore";

export interface NavApi {
  stack: Page[];
  current: Page;
  direction: "forward" | "back";
  via: NavVia;
  canGoBack: boolean;
  push(page: Page, via?: NavVia): void;
  pop(via?: NavVia): void;
  restore(page: Page): void;
}

export const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav outside NavProvider");
  return ctx;
}
