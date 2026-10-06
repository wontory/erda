import type { GetCharacterSkillCharacterSkillGrade } from "@erda/api/generated/model";
import { z } from "zod";

import { DATA_KEYS } from "#/features/data/store.ts";
import { useDataValue } from "#/features/data/use-data-value.ts";

export const SKILL_GRADES: Array<{ value: GetCharacterSkillCharacterSkillGrade; label: string }> = [
  { value: "0", label: "0차" },
  { value: "1", label: "1차" },
  { value: "1.5", label: "1.5차" },
  { value: "2", label: "2차" },
  { value: "2.5", label: "2.5차" },
  { value: "3", label: "3차" },
  { value: "4", label: "4차" },
  { value: "5", label: "5차" },
  { value: "6", label: "6차" },
  { value: "hyperpassive", label: "하이퍼 패시브" },
  { value: "hyperactive", label: "하이퍼 액티브" },
];

const skillGradeSchema = z.enum([
  "0",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "4",
  "5",
  "6",
  "hyperpassive",
  "hyperactive",
]) satisfies z.ZodType<GetCharacterSkillCharacterSkillGrade>;

export function useSkillGrade() {
  return useDataValue<GetCharacterSkillCharacterSkillGrade>(DATA_KEYS.skillGrade, skillGradeSchema, "6");
}
