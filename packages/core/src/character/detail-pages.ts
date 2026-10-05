export type DetailPage = "stats" | "equipment" | "appearance" | "skills" | "records" | "union";

export const DETAIL_PAGES: Array<{ id: DetailPage; title: string; color: string }> = [
  { id: "stats", title: "능력치", color: "bg-orange-500" },
  { id: "equipment", title: "장비", color: "bg-blue-500" },
  { id: "appearance", title: "외형", color: "bg-pink-500" },
  { id: "skills", title: "스킬", color: "bg-purple-500" },
  { id: "records", title: "랭킹 · 기록", color: "bg-yellow-500" },
  { id: "union", title: "유니온", color: "bg-green-500" },
];

export type DetailSectionId =
  | "stats"
  | "hyperStat"
  | "ability"
  | "otherStat"
  | "propensity"
  | "equipment"
  | "symbols"
  | "setEffect"
  | "cashItem"
  | "beauty"
  | "android"
  | "pet"
  | "skill"
  | "hexa"
  | "vMatrix"
  | "linkSkill"
  | "rings"
  | "ranking"
  | "dojang"
  | "battle"
  | "unionRaider"
  | "unionArtifact"
  | "unionChampion";

export const PAGE_SECTIONS: Record<DetailPage, DetailSectionId[]> = {
  stats: ["stats", "hyperStat", "ability", "otherStat", "propensity"],
  equipment: ["equipment", "symbols", "setEffect"],
  appearance: ["cashItem", "beauty", "android", "pet"],
  skills: ["skill", "hexa", "vMatrix", "linkSkill", "rings"],
  records: ["ranking", "dojang", "battle"],
  union: ["unionRaider", "unionArtifact", "unionChampion"],
};

export const SECTION_META: Record<DetailSectionId, { title: string; color: string }> = {
  stats: { title: "스탯", color: "bg-orange-500" },
  hyperStat: { title: "하이퍼 스탯", color: "bg-orange-500" },
  ability: { title: "어빌리티", color: "bg-purple-500" },
  otherStat: { title: "기타 스탯", color: "bg-gray-500" },
  propensity: { title: "성향", color: "bg-red-500" },
  equipment: { title: "장비", color: "bg-blue-500" },
  symbols: { title: "심볼", color: "bg-cyan-500" },
  setEffect: { title: "세트 효과", color: "bg-indigo-500" },
  cashItem: { title: "캐시 아이템", color: "bg-pink-500" },
  beauty: { title: "외형", color: "bg-pink-500" },
  android: { title: "안드로이드", color: "bg-amber-700" },
  pet: { title: "펫", color: "bg-emerald-400" },
  skill: { title: "스킬", color: "bg-purple-500" },
  hexa: { title: "HEXA 매트릭스", color: "bg-fuchsia-500" },
  vMatrix: { title: "V 매트릭스", color: "bg-violet-500" },
  linkSkill: { title: "링크 스킬", color: "bg-indigo-400" },
  rings: { title: "특수 반지", color: "bg-yellow-500" },
  ranking: { title: "랭킹", color: "bg-yellow-500" },
  dojang: { title: "무릉도장", color: "bg-red-500" },
  battle: { title: "연무장", color: "bg-orange-500" },
  unionRaider: { title: "유니온 공격대", color: "bg-green-500" },
  unionArtifact: { title: "유니온 아티팩트", color: "bg-teal-400" },
  unionChampion: { title: "유니온 챔피언", color: "bg-lime-500" },
};
