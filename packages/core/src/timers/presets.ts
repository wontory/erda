import { entryFromPreset, type TimerGroup } from "./groups.ts";

export type PresetCategory = "install" | "buff";

export interface TimerPreset {
  id: string;
  name: string;
  shortName: string;
  seconds: number;
  icon: string;
  category: PresetCategory;
  repeatsByDefault: boolean;
}

const presetOf =
  (category: PresetCategory, repeatsByDefault: boolean) =>
  (id: string, name: string, seconds: number, shortName: string, icon: string): TimerPreset => ({
    id,
    name,
    shortName,
    seconds,
    icon,
    category,
    repeatsByDefault,
  });
const install = presetOf("install", true);
const buff = presetOf("buff", false);

export const TIMER_PRESETS: readonly TimerPreset[] = [
  install("solJanus120", "솔 야누스 : 새벽 (2분)", 120, "야누스", "Sun"),
  install("solJanus80", "솔 야누스 : 새벽 (80초)", 80, "야누스", "Sun"),
  install("solJanus70", "솔 야누스 : 새벽 (70초)", 70, "야누스", "Sun"),
  install("solJanus60", "솔 야누스 : 새벽 (1분)", 60, "야누스", "Sun"),
  install("erdaFountain", "에르다 파운틴", 60, "파운틴", "Droplets"),
  install("hologramGraffiti", "홀로그램 그래피티: 역장 VI", 60, "역장", "Radio"),
  install("maehwaYein", "매화검 3초식 : 예인 VI", 28, "예인", "Sword"),
  install("petrified", "페트리파이드 VI", 60, "페트리", "Mountain"),
  install("gateOfLight", "진리의 문", 30, "진리의 문", "DoorOpen"),
  install("liberationOrb", "리버레이션 오브", 30, "오브", "Orbit"),
  install("swordOfBurningSoul", "소드 오브 버닝 소울", 117, "버닝 소울", "Flame"),
  install("frozenGround", "프로즌 그라운드 VI", 60, "프로즌", "Snowflake"),
  install("heupseongWaryu", "흡성와류 VI", 60, "흡성와류", "Tornado"),
  install("classInstall", "직업 설치기", 60, "설치기", "Hammer"),
  buff("rune", "룬 쿨타임", 15 * 60, "룬", "Sparkles"),
  buff("exp30", "경험치 쿠폰 30분", 30 * 60, "경쿠", "Ticket"),
  buff("exp60", "경험치 쿠폰 1시간", 60 * 60, "경쿠", "Ticket"),
  buff("wealthPotion", "재물 획득의 비약", 30 * 60, "재획", "Coins"),
  buff("goldPotion", "익스트림 골드 포션", 30 * 60, "골포", "FlaskConical"),
  buff("redPotion", "익스트림 레드 포션", 30 * 60, "레포", "FlaskConical"),
];

export const presetById = (id: string) => TIMER_PRESETS.find((p) => p.id === id);

export const PRESET_CATEGORY_META: Record<PresetCategory, { title: string; color: string }> = {
  install: { title: "설치기", color: "bg-orange-500" },
  buff: { title: "사냥 버프", color: "bg-green-500" },
};

export const DEFAULT_GROUPS: TimerGroup[] = [
  {
    id: "group-sample",
    name: "사냥 시작",
    entries: ["rune", "exp30", "wealthPotion"].map((id) => entryFromPreset(presetById(id)!, () => `entry-${id}`)),
  },
];
