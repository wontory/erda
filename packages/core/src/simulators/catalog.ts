export const SIMULATOR_IDS = ["starforce"] as const;
export type SimulatorId = (typeof SIMULATOR_IDS)[number];

export interface SimulatorMeta {
  title: string;
  summary: string;
  color: string;
}

export const SIMULATOR_META: Record<SimulatorId, SimulatorMeta> = {
  starforce: { title: "스타포스", summary: "강화 시뮬레이터", color: "bg-yellow-500" },
};
