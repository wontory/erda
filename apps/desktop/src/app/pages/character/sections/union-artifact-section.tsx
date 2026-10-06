import { getUserUnionArtifact } from "@erda/api/generated/endpoints/union/union";
import type { UnionArtifactUnionArtifactCrystalItem } from "@erda/api/generated/model";
import { TimeFormat } from "@erda/core";
import { Gem } from "lucide-react";

import { Section } from "./section.tsx";
import { ValueRow } from "./value-row.tsx";

function CrystalRow({ crystal: c }: { crystal: UnionArtifactUnionArtifactCrystalItem }) {
  const expired = c.validity_flag === "0" || c.validity_flag === "false";
  return (
    <div className="px-2 py-1 text-[12px]">
      <div className="flex justify-between">
        <span>
          {c.name} <span className="text-muted-foreground">Lv.{c.level}</span>
        </span>
        {expired ? (
          <span className="text-danger">만료</span>
        ) : (
          <span className="text-muted-foreground">~{TimeFormat.shortDate(c.date_expire)}</span>
        )}
      </div>
      <div className="text-muted-foreground">
        {[c.crystal_option_name_1, c.crystal_option_name_2, c.crystal_option_name_3].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}

export function UnionArtifactSection({ ocid }: { ocid: string }) {
  return (
    <Section
      id="unionArtifact"
      ocid={ocid}
      icon={Gem}
      fetcher={(p) => getUserUnionArtifact({ ocid }, { nexonCache: p })}
    >
      {(d) => (
        <>
          <ValueRow label="남은 AP" value={d.union_artifact_remain_ap ?? 0} />
          {(d.union_artifact_effect ?? []).map((e) => (
            <ValueRow key={e.name} label={e.name} value={`Lv.${e.level}`} />
          ))}
          {(d.union_artifact_crystal ?? []).map((c) => (
            <CrystalRow key={c.name} crystal={c} />
          ))}
        </>
      )}
    </Section>
  );
}
