import { describeError } from "@erda/api/errors";
import { getUserUnion } from "@erda/api/generated/endpoints/union/union";
import { KoreanNumber } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Metric } from "@erda/ui/components/metric";
import { Module } from "@erda/ui/components/module";

import { nullIfNotFound } from "#/features/character/queries.ts";
import { useExtra } from "#/features/character/use-extra.ts";

import { ValueRow } from "./value-row.tsx";

export function UnionSummarySection({ ocid }: { ocid: string }) {
  const query = useExtra("union", ocid, (p) => getUserUnion({ ocid }, { nexonCache: p }).catch(nullIfNotFound));
  const union = query.data;
  return (
    <Module>
      {query.isPending ? <LoadingRow /> : null}
      {query.error ? <ErrorRow message={describeError(query.error)} onRetry={() => query.refetch()} /> : null}
      {query.data !== undefined && !query.error ? (
        <>
          <div className="mb-2 grid grid-cols-2 gap-3">
            <Metric
              title="유니온"
              value={union?.union_level ? KoreanNumber.grouped(union.union_level) : "-"}
              tint="text-success"
            />
            <Metric title="아티팩트" value={union?.union_artifact_level ? `Lv.${union.union_artifact_level}` : "-"} />
          </div>
          {union?.union_grade ? <ValueRow label="등급" value={union.union_grade} /> : null}
        </>
      ) : null}
    </Module>
  );
}
