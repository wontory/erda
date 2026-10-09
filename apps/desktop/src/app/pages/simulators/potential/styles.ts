import type { PotentialGrade } from "@erda/core";

export const GRADE_TEXT: Record<PotentialGrade, string> = {
  rare: "text-grade-rare",
  epic: "text-grade-epic",
  unique: "text-grade-unique",
  legendary: "text-grade-legendary",
};

export const GRADE_DOT: Record<PotentialGrade, string> = {
  rare: "bg-grade-rare",
  epic: "bg-grade-epic",
  unique: "bg-grade-unique",
  legendary: "bg-grade-legendary",
};

export const GRADE_HEADER: Record<PotentialGrade, string> = {
  rare: "bg-grade-rare/12",
  epic: "bg-grade-epic/12",
  unique: "bg-grade-unique/12",
  legendary: "bg-grade-legendary/12",
};

export const GRADE_BORDER: Record<PotentialGrade, string> = {
  rare: "border-grade-rare/60",
  epic: "border-grade-epic/60",
  unique: "border-grade-unique/60",
  legendary: "border-grade-legendary/60",
};

export function statLabel(key: string): string {
  if (key.endsWith("%")) return `${key.slice(0, -1)} %`;
  if (key.endsWith("초")) return `${key.slice(0, -1)} (초)`;
  return key;
}
