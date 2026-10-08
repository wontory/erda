export type BossCycle = "daily" | "weekly" | "monthly";

export interface BossEntry {
  id: string;
  name: string;
  difficulty: string;
  price: number;
  cycle: BossCycle;
}

export const CYCLES: BossCycle[] = ["daily", "weekly", "monthly"];

export const PRICE_BASE_DATE = "2026-09-17";

const bossOf =
  (cycle: BossCycle) =>
  (id: string, name: string, difficulty: string, price: number): BossEntry => ({ id, name, difficulty, price, cycle });
const daily = bossOf("daily");
const weekly = bossOf("weekly");
const monthly = bossOf("monthly");

export const BOSS_CATALOG: readonly BossEntry[] = [
  daily("zakum.easy", "자쿰", "이지", 114_000),
  daily("zakum.normal", "자쿰", "노멀", 349_000),
  daily("papulatus.easy", "파풀라투스", "이지", 390_000),
  daily("magnus.easy", "매그너스", "이지", 411_000),
  daily("hilla.normal", "힐라", "노멀", 455_000),
  daily("horntail.easy", "혼테일", "이지", 502_000),
  daily("bloodyqueen.normal", "블러디퀸", "노멀", 551_000),
  daily("vonbon.normal", "반반", "노멀", 551_000),
  daily("pierre.normal", "피에르", "노멀", 551_000),
  daily("vellum.normal", "벨룸", "노멀", 551_000),
  daily("horntail.normal", "혼테일", "노멀", 576_000),
  daily("vonleon.easy", "반 레온", "이지", 602_000),
  daily("arkarium.easy", "아카이럼", "이지", 656_000),
  daily("cygnus.easy", "시그너스", "이지", 712_000),
  daily("horntail.chaos", "혼테일", "카오스", 770_000),
  daily("pinkbean.normal", "핑크빈", "노멀", 799_000),
  daily("vonleon.normal", "반 레온", "노멀", 830_000),
  daily("vonleon.hard", "반 레온", "하드", 1_070_000),
  daily("arkarium.normal", "아카이럼", "노멀", 1_110_000),
  daily("magnus.normal", "매그너스", "노멀", 1_160_000),
  daily("papulatus.normal", "파풀라투스", "노멀", 1_200_000),
  daily("hilla.hard", "힐라", "하드", 1_280_000),
  daily("pinkbean.chaos", "핑크빈", "카오스", 1_320_000),
  daily("cygnus.normal", "시그너스", "노멀", 1_360_000),
  weekly("zakum.chaos", "자쿰", "카오스", 4_040_000),
  weekly("bloodyqueen.chaos", "블러디퀸", "카오스", 4_070_000),
  weekly("vonbon.chaos", "반반", "카오스", 4_070_000),
  weekly("pierre.chaos", "피에르", "카오스", 4_080_000),
  weekly("magnus.hard", "매그너스", "하드", 4_280_000),
  weekly("vellum.chaos", "벨룸", "카오스", 4_640_000),
  weekly("papulatus.chaos", "파풀라투스", "카오스", 6_550_000),
  weekly("lotus.normal", "스우", "노멀", 8_350_000),
  weekly("damien.normal", "데미안", "노멀", 8_750_000),
  weekly("slime.normal", "가디언 엔젤 슬라임", "노멀", 12_700_000),
  weekly("lucid.easy", "루시드", "이지", 14_900_000),
  weekly("will.easy", "윌", "이지", 16_100_000),
  weekly("lucid.normal", "루시드", "노멀", 17_800_000),
  weekly("will.normal", "윌", "노멀", 20_500_000),
  weekly("dusk.normal", "더스크", "노멀", 22_000_000),
  weekly("dunkel.normal", "듄켈", "노멀", 23_700_000),
  weekly("damien.hard", "데미안", "하드", 46_400_000),
  weekly("lotus.hard", "스우", "하드", 48_900_000),
  weekly("lucid.hard", "루시드", "하드", 59_700_000),
  weekly("dusk.chaos", "더스크", "카오스", 66_300_000),
  weekly("hilla2.normal", "진 힐라", "노멀", 67_600_000),
  weekly("slime.chaos", "가디언 엔젤 슬라임", "카오스", 71_300_000),
  weekly("will.hard", "윌", "하드", 73_200_000),
  weekly("dunkel.hard", "듄켈", "하드", 89_600_000),
  weekly("hilla2.hard", "진 힐라", "하드", 100_000_000),
  weekly("seren.normal", "선택받은 세렌", "노멀", 167_000_000),
  weekly("kalos.easy", "감시자 칼로스", "이지", 238_000_000),
  weekly("adversary.easy", "최초의 대적자", "이지", 261_000_000),
  weekly("seren.hard", "선택받은 세렌", "하드", 302_000_000),
  weekly("kaling.easy", "카링", "이지", 320_000_000),
  weekly("bellona.easy", "벨로나", "이지", 396_000_000),
  weekly("kalos.normal", "감시자 칼로스", "노멀", 479_000_000),
  weekly("adversary.normal", "최초의 대적자", "노멀", 532_000_000),
  weekly("lotus.extreme", "스우", "익스트림", 545_000_000),
  weekly("kaling.normal", "카링", "노멀", 576_000_000),
  weekly("star.normal", "찬란한 흉성", "노멀", 593_000_000),
  weekly("bellona.normal", "벨로나", "노멀", 824_000_000),
  weekly("limbo.normal", "림보", "노멀", 995_000_000),
  weekly("kalos.chaos", "감시자 칼로스", "카오스", 1_230_000_000),
  weekly("baldrix.normal", "발드릭스", "노멀", 1_320_000_000),
  weekly("adversary.hard", "최초의 대적자", "하드", 1_390_000_000),
  weekly("jupiter.normal", "유피테르", "노멀", 1_560_000_000),
  weekly("kaling.hard", "카링", "하드", 1_560_000_000),
  weekly("seren.extreme", "선택받은 세렌", "익스트림", 1_840_000_000),
  weekly("limbo.hard", "림보", "하드", 2_385_000_000),
  weekly("star.hard", "찬란한 흉성", "하드", 2_678_000_000),
  weekly("bellona.hard", "벨로나", "하드", 2_950_000_000),
  weekly("baldrix.hard", "발드릭스", "하드", 3_078_000_000),
  weekly("kalos.extreme", "감시자 칼로스", "익스트림", 4_104_000_000),
  weekly("adversary.extreme", "최초의 대적자", "익스트림", 4_712_000_000),
  weekly("jupiter.hard", "유피테르", "하드", 4_845_000_000),
  weekly("kaling.extreme", "카링", "익스트림", 5_387_000_000),
  monthly("blackmage.hard", "검은 마법사", "하드", 465_000_000),
  monthly("blackmage.extreme", "검은 마법사", "익스트림", 5_680_000_000),
];

const BY_ID = new Map(BOSS_CATALOG.map((e) => [e.id, e]));

export const bossById = (id: string): BossEntry | undefined => BY_ID.get(id);
export const bossesOf = (cycle: BossCycle): BossEntry[] => BOSS_CATALOG.filter((e) => e.cycle === cycle);
export const findBoss = (name: string, difficulty: string): BossEntry | undefined =>
  BOSS_CATALOG.find((e) => e.name === name && e.difficulty === difficulty);

export const DEFAULT_SELECTED: readonly string[] = [
  "zakum.chaos",
  "pierre.chaos",
  "vonbon.chaos",
  "bloodyqueen.chaos",
  "vellum.chaos",
  "magnus.hard",
  "papulatus.chaos",
  "lotus.normal",
  "damien.normal",
  "slime.normal",
  "lucid.easy",
  "will.easy",
  "dusk.normal",
  "dunkel.normal",
];

export interface CycleMeta {
  title: string;
  resetLabel: string;
}

export const CYCLE_META: Record<BossCycle, CycleMeta> = {
  daily: { title: "일일", resetLabel: "매일 00:00 초기화" },
  weekly: { title: "주간", resetLabel: "매주 목요일 00:00 초기화" },
  monthly: { title: "월간", resetLabel: "매월 1일 00:00 초기화" },
};

const FALLBACK_DIFFICULTY_COLOR = "bg-orange-500";

const DIFFICULTY_COLOR: Record<string, string> = {
  이지: "bg-gray-400",
  노멀: "bg-blue-500",
  하드: "bg-red-500",
  카오스: "bg-purple-500",
  익스트림: "bg-neutral-900",
};

export const difficultyColor = (difficulty: string): string =>
  DIFFICULTY_COLOR[difficulty] ?? FALLBACK_DIFFICULTY_COLOR;
