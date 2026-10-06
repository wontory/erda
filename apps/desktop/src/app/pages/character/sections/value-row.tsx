import { Item, ItemContent, ItemTitle } from "@erda/ui/components/ui/item";
import type { ReactNode } from "react";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";

export function ValueRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <Item size="row">
      <ItemContent className="min-w-0">
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
      <ItemValue className="text-right">{value}</ItemValue>
    </Item>
  );
}
