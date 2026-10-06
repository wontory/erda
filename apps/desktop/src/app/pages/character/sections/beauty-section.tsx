import { getCharacterBeautyEquipment } from "@erda/api/generated/endpoints/character/character";
import { Scissors } from "lucide-react";

import { SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

type Look = { name?: string | null; base?: string | null; mix?: string | null; rate?: string | null };
type Colored = { base_color?: string | null; mix_color?: string | null; mix_rate?: string | null };

const lookText = (h?: Look | null) =>
  h ? `${h.name ?? "-"}${h.base ? ` · ${h.base}${h.mix ? ` + ${h.mix} ${h.rate ?? ""}%` : ""}` : ""}` : "-";

const hair = (h?: (Colored & { hair_name?: string | null }) | null): Look | null =>
  h ? { name: h.hair_name, base: h.base_color, mix: h.mix_color, rate: h.mix_rate } : null;
const face = (f?: (Colored & { face_name?: string | null }) | null): Look | null =>
  f ? { name: f.face_name, base: f.base_color, mix: f.mix_color, rate: f.mix_rate } : null;

const skinText = (s?: { skin_name?: string | null; color_style?: string | null } | null) =>
  s ? `${s.skin_name ?? "-"}${s.color_style ? ` · ${s.color_style}` : ""}` : "-";

export function BeautySection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="beauty"
      ocid={ocid}
      icon={Scissors}
      fetcher={(p) => getCharacterBeautyEquipment({ ocid }, { nexonCache: p })}
    >
      {(d) => (
        <>
          <ValueRow label="헤어" value={lookText(hair(d.character_hair))} />
          <ValueRow label="성형" value={lookText(face(d.character_face))} />
          <ValueRow label="피부" value={skinText(d.character_skin)} />
          {d.additional_character_hair ? (
            <>
              <SubHeading className="mt-2">코디 (추가 외형)</SubHeading>
              <ValueRow label="헤어" value={lookText(hair(d.additional_character_hair))} />
              <ValueRow label="성형" value={lookText(face(d.additional_character_face))} />
            </>
          ) : null}
        </>
      )}
    </Section>
  );
}
