import {
  EMPTY_AUTO_TARGET,
  MAX_AUTO_TARGETS,
  POTENTIAL_GRADES,
  POTENTIAL_GRADE_LABELS,
  TRIPLE_RESET_TIMES,
  canStartAuto,
  gradeIndex,
  usesTargets,
  isEmptyTarget,
  lineTables,
  parseStat,
  statTotals,
  type AutoTarget,
  type PotentialData,
  type PotentialGoal,
  type PotentialGrade,
  type PotentialTarget,
} from "@erda/core";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Button } from "@erda/ui/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@erda/ui/components/ui/select";
import { useMemo, useState } from "react";

import {
  SheetBody,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetLayout,
  SheetTitle,
} from "#/sheet/sheet-layout.tsx";

import { statLabel } from "./styles.ts";

const NONE = "";

const padTargets = (targets: readonly AutoTarget[]): AutoTarget[] =>
  Array.from({ length: MAX_AUTO_TARGETS }, (_, i) => targets[i] ?? EMPTY_AUTO_TARGET);

function requirement(target: AutoTarget): string {
  const picked = target.filter((t): t is string => t !== null);
  const sums = [...statTotals(picked.filter((t) => parseStat(t)).map((text) => ({ text, lower: false })))]
    .filter(([key]) => picked.some((t) => parseStat(t)?.key === key))
    .map(([key, value]) => `${statLabel(key)} ${value} 이상`);
  const exact = picked.filter((t) => !parseStat(t));
  return [...sums, ...exact].join(" · ");
}

function TargetRow({
  index,
  target,
  lines,
  onChange,
}: {
  index: number;
  target: AutoTarget;
  lines: { value: string; label: string }[][];
  onChange: (target: AutoTarget) => void;
}) {
  const summary = requirement(target);
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-foreground/4 p-2">
      <div className="flex h-8 items-center justify-between gap-2">
        <span className="text-[13px] font-semibold">목표 {index + 1}</span>
        <Button variant="ghost" disabled={isEmptyTarget(target)} onClick={() => onChange(EMPTY_AUTO_TARGET)}>
          초기화
        </Button>
      </div>
      {lines.map((items, line) => (
        <Select
          key={line}
          items={items}
          value={target[line] ?? NONE}
          onValueChange={(v) => {
            const next = [...target];
            next[line] = typeof v === "string" && v !== NONE ? v : null;
            onChange(next);
          }}
        >
          <SelectTrigger className="w-full" aria-label={`목표 ${index + 1} ${line + 1}번째 옵션`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {summary ? <p className="m-0 text-[12px] text-muted-foreground">{summary}이면 멈춰요</p> : null}
    </div>
  );
}

export function AutoSheet({
  data,
  target,
  current,
  goal,
  onClose,
  onStart,
}: {
  data: PotentialData | undefined;
  target: PotentialTarget;
  current: PotentialGrade;
  goal: PotentialGoal;
  onClose: () => void;
  onStart: (goal: PotentialGoal, times: number) => void;
}) {
  const above = POTENTIAL_GRADES.filter((g) => gradeIndex(g) > gradeIndex(current));
  const higher = above.length > 0 ? above : POTENTIAL_GRADES.filter(usesTargets);
  const [grade, setGrade] = useState<PotentialGrade>(() =>
    higher.includes(goal.grade) ? goal.grade : higher[higher.length - 1],
  );
  const legendary = usesTargets(grade);
  const [targets, setTargets] = useState(() => padTargets(goal.targets));
  const lines = useMemo(() => {
    const tables = data ? lineTables(data, target, "legendary") : null;
    return (tables ?? [[], [], []]).map((table) => [
      { value: NONE, label: "선택 안 함" },
      ...[...new Set(table.map((e) => e.text))].map((text) => ({ value: text, label: text })),
    ]);
  }, [data, target]);
  const next: PotentialGoal = { grade, targets };
  const ready = !!data && canStartAuto(current, next);
  const gradeItems = higher.map((g) => ({ value: g, label: POTENTIAL_GRADE_LABELS[g] }));
  const start = (times: number) => {
    onStart(next, times);
    onClose();
  };

  return (
    <SheetLayout>
      <SheetHeader>
        <SheetTitle>자동 재설정</SheetTitle>
        <SheetDescription>
          {legendary
            ? "레전드리까지 오르는 결과는 적용하며 돌리고, 목표 중 하나라도 옵션 수치의 합이 목표 이상이 되면 멈춰요. 목표 옵션을 비우면 레전드리가 나올 때 멈춰요."
            : "목표 등급이 나오면 멈춰요. 가는 길에 등급이 오르면 그 결과를 적용하고 계속 돌려요."}
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        {data ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 text-[12px]">
              <span>목표 등급</span>
              <Select
                items={gradeItems}
                value={grade}
                onValueChange={(v) => {
                  const g = higher.find((o) => o === v);
                  if (g) setGrade(g);
                }}
              >
                <SelectTrigger className="w-full" aria-label="목표 등급">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradeItems.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={legendary ? "flex flex-col gap-2" : "hidden"}>
              <span className="text-[12px]">목표 옵션</span>
              {targets.map((t, i) => (
                <TargetRow
                  key={i}
                  index={i}
                  target={t}
                  lines={lines}
                  onChange={(changed) => setTargets((list) => list.map((x, j) => (j === i ? changed : x)))}
                />
              ))}
            </div>
          </div>
        ) : (
          <LoadingRow label="옵션표 불러오는 중…" minHeight={legendary ? 764 : 55} />
        )}
      </SheetBody>
      <SheetFooter>
        <Button disabled={!ready} onClick={() => start(1)}>
          자동 재설정
        </Button>
        <Button
          variant="secondary"
          title="MVP 골드 이상 혜택"
          disabled={!ready}
          onClick={() => start(TRIPLE_RESET_TIMES)}
        >
          {TRIPLE_RESET_TIMES}회 자동 재설정
        </Button>
      </SheetFooter>
    </SheetLayout>
  );
}
