import { KoreanNumber } from "#/format/korean-number.ts";
import { TimeFormat } from "#/format/time.ts";
import { numberField, stringField } from "#/shared/raw.ts";

export type RankingCardId = "overall" | "union" | "dojang" | "theseed" | "achievement" | "guild";
export type CharacterRankingId = Exclude<RankingCardId, "guild">;
export const CHARACTER_RANKING_ORDER: CharacterRankingId[] = ["overall", "union", "dojang", "theseed", "achievement"];

export const RANKING_META: Record<RankingCardId, { color: string }> = {
  overall: { color: "bg-orange-500" },
  union: { color: "bg-blue-500" },
  dojang: { color: "bg-red-500" },
  theseed: { color: "bg-teal-500" },
  achievement: { color: "bg-green-500" },
  guild: { color: "bg-indigo-500" },
};

export type RankingCardStatus = "ok" | "none" | "notFound" | "error";

export interface RankingCard {
  id: RankingCardId;
  title: string;
  rank: number | null;
  detail: string;
  sub: string;
  status: RankingCardStatus;
  error?: string;
}

type Row = object;

interface RankingCardInput {
  row: Row | undefined;
  name: string;
  world: string;
  date: string;
  dojangHard?: boolean;
}

const n = (r: Row, key: string): number => numberField(r, key) ?? 0;
const s = stringField;

export const findRow = <R extends Row>(
  rows: readonly R[] | undefined,
  key: "character_name" | "guild_name",
  value: string,
): R | undefined => rows?.find((r) => (r as Record<string, unknown>)[key] === value);

function titleOf(id: RankingCardId, input: Pick<RankingCardInput, "world" | "dojangHard">): string {
  switch (id) {
    case "overall":
      return `종합 (${input.world})`;
    case "union":
      return "유니온";
    case "dojang":
      return `무릉도장 (${input.dojangHard === false ? "일반" : "통달"})`;
    case "theseed":
      return "더 시드";
    case "achievement":
      return "업적";
    case "guild":
      return "길드 명성치";
  }
}

function detailOf(id: RankingCardId, r: Row): string {
  switch (id) {
    case "overall":
      return `Lv.${n(r, "character_level")} · ${s(r, "class_name")}`;
    case "union":
      return `Lv.${n(r, "union_level")} · 전투력 ${KoreanNumber.format(n(r, "union_power"))}`;
    case "dojang":
      return `${n(r, "dojang_floor")}층 · ${TimeFormat.clock(n(r, "dojang_time_record"))}`;
    case "theseed":
      return `${n(r, "theseed_floor")}층 · ${TimeFormat.clock(n(r, "theseed_time_record"))}`;
    case "achievement":
      return `${s(r, "trophy_grade")} · ${KoreanNumber.grouped(n(r, "trophy_score"))}점`;
    case "guild":
      return `Lv.${n(r, "guild_level")} · ${KoreanNumber.grouped(n(r, "guild_point"))}점`;
  }
}

function subtitleOf(id: RankingCardId, input: RankingCardInput): string {
  const scope = `${input.world} · 기준일 ${input.date}`;
  return id === "guild" ? scope : `${input.name} · ${scope}`;
}

export function buildRankingCard(id: RankingCardId, input: RankingCardInput): RankingCard {
  const sub = subtitleOf(id, input);
  const title = titleOf(id, input);
  if (!input.row) return { id, title, rank: null, detail: "순위권 밖 또는 데이터 없음", sub, status: "none" };
  return { id, title, rank: n(input.row, "ranking") || null, detail: detailOf(id, input.row), sub, status: "ok" };
}
