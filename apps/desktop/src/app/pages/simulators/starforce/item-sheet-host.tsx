import { describeError } from "@erda/api/errors";
import type { StarforceItem } from "@erda/core";

import { SideSheet } from "#/features/sheet/side-sheet.tsx";

import { useEquippedCandidates } from "./use-equipped-candidates.ts";

export function ItemSheetHost({
  item,
  level,
  startStar,
  onApply,
  onClose,
}: {
  item: StarforceItem | null;
  level: number;
  startStar: number;
  onApply: (item: StarforceItem | null, level: number, startStar: number) => void;
  onClose: () => void;
}) {
  const { owner, candidates, isPending, error } = useEquippedCandidates();
  return (
    <SideSheet
      kind="starforce-item"
      props={{
        item,
        level,
        startStar,
        equipped: { owner, candidates, isPending, error: error ? describeError(error) : null },
      }}
      onResult={(type, value) => {
        if (type !== "apply") return;
        const v = value as { item: StarforceItem | null; level: number; startStar: number };
        onApply(v.item, v.level, v.startStar);
      }}
      onClose={onClose}
    />
  );
}
