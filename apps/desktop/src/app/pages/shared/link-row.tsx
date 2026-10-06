import { Item, ItemContent, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { ItemValue } from "./item-value.tsx";

export function LinkRow({
  media,
  title,
  value,
  onClick,
}: {
  media: ReactNode;
  title: ReactNode;
  value?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Item size="row" render={(props) => <button type="button" {...props} />} onClick={onClick}>
      <ItemMedia>{media}</ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{title}</ItemTitle>
      </ItemContent>
      {value !== undefined ? <ItemValue>{value}</ItemValue> : null}
      <ChevronRight size={14} className="text-muted-foreground" />
    </Item>
  );
}
