import { getCharacterSkill } from "@erda/api/generated/endpoints/character/character";
import { GameIcon } from "@erda/ui/components/game-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@erda/ui/components/ui/select";
import { Sparkles } from "lucide-react";

import { SKILL_GRADES, useSkillGrade } from "#/features/character/use-skill-grade.ts";
import { runAction } from "#/lib/action.ts";

import { Section } from "./section.tsx";

type Grade = ReturnType<typeof useSkillGrade>[0];

export function SkillRow({
  icon,
  name,
  level,
  effect,
}: {
  icon?: string | null;
  name?: string | null;
  level?: number | null;
  effect?: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5 px-2 py-1 text-[12px]">
      <GameIcon src={icon} size={28} />
      <div className="min-w-0">
        <div className="font-semibold">
          {name}{" "}
          {level !== null && level !== undefined ? (
            <span className="font-normal text-muted-foreground">Lv.{level}</span>
          ) : null}
        </div>
        {effect ? <div className="line-clamp-3 whitespace-pre-line text-muted-foreground">{effect}</div> : null}
      </div>
    </div>
  );
}

function SkillGradeSelect({ grade, onChange }: { grade: Grade; onChange: (grade: Grade) => void }) {
  return (
    <Select
      value={grade}
      onValueChange={(v) => {
        const g = SKILL_GRADES.find((o) => o.value === v)?.value;
        if (g) onChange(g);
      }}
    >
      <SelectTrigger className="h-7 w-32" aria-label="스킬 차수">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SKILL_GRADES.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SkillSection({ ocid }: { ocid: string }) {
  const [grade, setGrade] = useSkillGrade();
  return (
    <Section
      id="skill"
      ocid={ocid}
      icon={Sparkles}
      extraKey={grade}
      fetcher={(p) => getCharacterSkill({ ocid, character_skill_grade: grade }, { nexonCache: p })}
      trailing={
        <SkillGradeSelect
          grade={grade}
          onChange={(g) => void runAction(() => setGrade(g), "스킬 차수를 저장하지 못했어요")}
        />
      }
      isEmpty={(d) => (d.character_skill ?? []).length === 0}
    >
      {(d) => (
        <>
          {(d.character_skill ?? []).map((s) => (
            <SkillRow
              key={s.skill_name}
              icon={s.skill_icon}
              name={s.skill_name}
              level={s.skill_level}
              effect={s.skill_effect}
            />
          ))}
        </>
      )}
    </Section>
  );
}
