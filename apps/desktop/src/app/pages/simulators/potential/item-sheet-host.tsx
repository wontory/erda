import { describeError } from "@erda/api/errors";

import { SideSheet } from "#/features/sheet/side-sheet.tsx";

import type { ItemDraft } from "./item-sheet.tsx";
import { useEquippedPotentials } from "./use-equipped-potentials.ts";

export function ItemSheetHost({
  initial,
  onApply,
  onClose,
}: {
  initial: ItemDraft;
  onApply: (draft: ItemDraft) => void;
  onClose: () => void;
}) {
  const { owner, candidates, isPending, error } = useEquippedPotentials();
  return (
    <SideSheet
      kind="potential-item"
      props={{ initial, equipped: { owner, candidates, isPending, error: error ? describeError(error) : null } }}
      onResult={(type, value) => {
        if (type === "apply") onApply(value as ItemDraft);
      }}
      onClose={onClose}
    />
  );
}
