import { getUserUnionRaider } from "@erda/api/generated/endpoints/union/union";
import { presetNo } from "@erda/core";
import { Swords } from "lucide-react";
import { useState } from "react";

import { PresetPicker } from "./preset-picker.tsx";
import { SectionNote, SubHeading } from "./section-text.tsx";
import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

function StatList({ title, items }: { title: string; items: string[] | null | undefined }) {
  if (!items || !items.length) return null;
  return (
    <div className="mb-1">
      <SubHeading>{title}</SubHeading>
      {items.map((s, i) => (
        <div key={i} className="px-2 text-[12px]">
          {s}
        </div>
      ))}
    </div>
  );
}

function blockCounts(blocks: Array<{ block_type?: string | null }>) {
  const counts = new Map<string, number>();
  for (const b of blocks) counts.set(b.block_type ?? "", (counts.get(b.block_type ?? "") ?? 0) + 1);
  return [...counts.entries()].toSorted(([a], [b]) => a.localeCompare(b, "ko"));
}

export function UnionRaiderSection({ ocid }: { ocid: string }) {
  const [preset, setPreset] = useState<string | null>(null);
  return (
    <Section
      id="unionRaider"
      ocid={ocid}
      icon={Swords}
      fetcher={(p) => getUserUnionRaider({ ocid }, { nexonCache: p })}
    >
      {(d) => {
        const current = presetNo(d.use_preset_no, 5);
        const active = preset ?? current ?? "1";
        const chosen =
          active === current
            ? d
            : ((d as Record<string, unknown>)[`union_raider_preset_${active}`] as typeof d | null | undefined);
        const blocks = chosen?.union_block ?? [];
        const counts = blockCounts(blocks);
        return (
          <>
            <PresetPicker count={5} value={active} current={current} onChange={setPreset} />
            {!chosen || (blocks.length === 0 && !chosen.union_raider_stat?.length) ? (
              <SectionNote>넥슨 API가 이 프리셋 정보를 주지 않았어요.</SectionNote>
            ) : (
              <>
                <ValueRow label="블록" value={`${blocks.length}개 · 최대 ${d.union_max_point ?? "-"}`} />
                {counts.length ? (
                  <div className="px-2 text-[12px] text-muted-foreground">
                    {counts.map(([t, n]) => `${t} ${n}`).join(" · ")}
                  </div>
                ) : null}
                <StatList title="공격대원 효과" items={chosen.union_raider_stat} />
                <StatList title="점령 효과" items={chosen.union_occupied_stat} />
                <StatList title="내부 영역" items={chosen.union_inner_stat?.map((s) => s.stat_field_effect ?? "")} />
              </>
            )}
          </>
        );
      }}
    </Section>
  );
}
