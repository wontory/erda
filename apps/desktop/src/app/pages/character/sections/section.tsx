import { describeError } from "@erda/api/errors";
import type { NexonCachePolicy } from "@erda/api/mutator";
import { SECTION_META, type DetailSectionId } from "@erda/core";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { SectionHeader } from "@erda/ui/components/section-header";
import { Swap } from "@erda/ui/components/swap";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useExtra } from "#/features/character/use-extra.ts";
import { useInView } from "#/features/character/use-in-view.ts";
import { ErrorBoundary } from "#/lib/error-boundary.tsx";

const LOADING_HEIGHT: Partial<Record<DetailSectionId, number>> = {
  equipment: 320,
  symbols: 240,
  skill: 240,
  cashItem: 240,
  hexa: 200,
  vMatrix: 200,
  linkSkill: 160,
  otherStat: 200,
  hyperStat: 200,
  ability: 140,
  propensity: 200,
  unionRaider: 200,
  setEffect: 120,
};
const DEFAULT_LOADING_HEIGHT = 64;

export function Section<T>({
  id,
  ocid,
  icon,
  fetcher,
  extraKey,
  trailing,
  isEmpty,
  children,
}: {
  id: DetailSectionId;
  ocid: string;
  icon: LucideIcon;
  fetcher: (policy: NexonCachePolicy) => Promise<T>;
  extraKey?: string;
  trailing?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useExtra<T>(id, ocid, fetcher, { enabled: inView, extraKey });
  const meta = SECTION_META[id];
  const data = query.data;
  const retry = () => query.refetch();
  return (
    <div ref={ref}>
      <Module>
        <SectionHeader title={meta.title} color={meta.color} icon={icon} trailing={trailing} />
        <AutoHeight>
          <Swap id={data !== undefined ? "data" : query.error ? "error" : "loading"}>
            {data === undefined && (!inView || query.isPending) ? (
              <LoadingRow minHeight={LOADING_HEIGHT[id] ?? DEFAULT_LOADING_HEIGHT} />
            ) : null}
            {query.error ? <ErrorRow message={describeError(query.error)} onRetry={retry} /> : null}
            {data !== undefined ? (
              <ErrorBoundary
                resetKeys={[data]}
                fallback={(_, reset) => (
                  <ErrorRow
                    message="이 정보를 표시하지 못했어요"
                    onRetry={() => {
                      reset();
                      retry();
                    }}
                  />
                )}
              >
                <SectionBody data={data} isEmpty={isEmpty} render={children} />
              </ErrorBoundary>
            ) : null}
          </Swap>
        </AutoHeight>
      </Module>
    </div>
  );
}

function SectionBody<T>({
  data,
  isEmpty,
  render,
}: {
  data: T;
  isEmpty?: (data: T) => boolean;
  render: (data: T) => ReactNode;
}) {
  return isEmpty?.(data) ? (
    <p className="px-2 py-1 text-[12px] text-muted-foreground">해당 정보가 없어요</p>
  ) : (
    render(data)
  );
}
