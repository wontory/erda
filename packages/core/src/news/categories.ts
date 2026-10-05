export type NewsCategory = "notice" | "update" | "event" | "cashshop";

export const NEWS_CATEGORIES: NewsCategory[] = ["notice", "update", "event", "cashshop"];

export interface NewsEntry {
  id: string;
  category: NewsCategory;
  noticeId: number;
  title: string;
  url: string;
  date: string;
  start: string | null;
  end: string | null;
  ongoing: boolean | null;
}

export interface NewsCategoryMeta {
  title: string;
  color: string;
  text: string;
  icon: string;
  alerts: boolean;
}

export const NEWS_META: Record<NewsCategory, NewsCategoryMeta> = {
  notice: { title: "공지", color: "bg-blue-500", text: "text-blue-500", icon: "Megaphone", alerts: true },
  update: { title: "업데이트", color: "bg-purple-500", text: "text-purple-500", icon: "ArrowDown", alerts: true },
  event: { title: "이벤트", color: "bg-green-500", text: "text-green-500", icon: "Gift", alerts: true },
  cashshop: { title: "캐시샵", color: "bg-pink-500", text: "text-pink-500", icon: "ShoppingBag", alerts: false },
};

export const MAINTENANCE_META = { title: "점검", color: "bg-orange-500", text: "text-orange-500", icon: "Wrench" };

export const newsCategoryByTitle = (title: string): NewsCategory | undefined =>
  NEWS_CATEGORIES.find((c) => NEWS_META[c].title === title);
