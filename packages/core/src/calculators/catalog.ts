export const CALCULATOR_IDS = ["boss-split"] as const;
export type CalculatorId = (typeof CALCULATOR_IDS)[number];

export interface CalculatorMeta {
  title: string;
  summary: string;
  color: string;
}

export const CALCULATOR_META: Record<CalculatorId, CalculatorMeta> = {
  "boss-split": { title: "보스 분배금", summary: "수수료·비율", color: "bg-amber-500" },
};
