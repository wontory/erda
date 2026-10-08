import type { CalculatorId, DetailPage, HistoryKind } from "@erda/core";

export type Page =
  | { id: "home"; kind: "home" }
  | { id: "character"; kind: "character" }
  | { id: "timers"; kind: "timers" }
  | { id: "scheduler"; kind: "scheduler" }
  | { id: "news"; kind: "news" }
  | { id: string; kind: "article"; entryId: string }
  | { id: string; kind: "calculator"; calculator: CalculatorId }
  | { id: "account"; kind: "account" }
  | { id: string; kind: "history"; history: HistoryKind }
  | { id: "achievements"; kind: "achievements" }
  | { id: string; kind: "results"; query: string }
  | { id: string; kind: "viewing"; ocid: string; name: string }
  | { id: string; kind: "section"; ocid: string; name: string; page: DetailPage }
  | { id: string; kind: "guild"; world: string; name: string };

export type NavAction =
  | { type: "push"; page: Page }
  | { type: "pop" }
  | { type: "reset" }
  | { type: "restore"; page: Page };

export const HOME: Page = { id: "home", kind: "home" };

export const pages = {
  character: (): Page => ({ id: "character", kind: "character" }),
  timers: (): Page => ({ id: "timers", kind: "timers" }),
  scheduler: (): Page => ({ id: "scheduler", kind: "scheduler" }),
  news: (): Page => ({ id: "news", kind: "news" }),
  article: (entryId: string): Page => ({ id: `article|${entryId}`, kind: "article", entryId }),
  calculator: (calculator: CalculatorId): Page => ({ id: `calculator|${calculator}`, kind: "calculator", calculator }),
  account: (): Page => ({ id: "account", kind: "account" }),
  history: (history: HistoryKind): Page => ({ id: `history|${history}`, kind: "history", history }),
  achievements: (): Page => ({ id: "achievements", kind: "achievements" }),
  results: (query: string): Page => ({ id: `results|${query}`, kind: "results", query }),
  viewing: (ocid: string, name: string): Page => ({ id: `viewing|${ocid}`, kind: "viewing", ocid, name }),
  section: (ocid: string, name: string, page: DetailPage): Page => ({
    id: `section|${ocid}|${page}`,
    kind: "section",
    ocid,
    name,
    page,
  }),
  guild: (world: string, name: string): Page => ({ id: `guild|${world}|${name}`, kind: "guild", world, name }),
};

export function navReducer(state: Page[], action: NavAction): Page[] {
  switch (action.type) {
    case "push": {
      const top = state[state.length - 1];
      if (top?.id === action.page.id) return [...state.slice(0, -1), action.page];
      return [...state, action.page];
    }
    case "pop":
      return state.length > 1 ? state.slice(0, -1) : state;
    case "reset":
      return [HOME];
    case "restore":
      return action.page.kind === "home" ? [HOME] : [HOME, action.page];
  }
}
