import { MAINTENANCE_META, NEWS_META, type NewsCategory } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";

import { MaintenanceIcon, newsIcon } from "#/features/news/icons.ts";

export function NewsTile({
  category,
  maintenance,
  size = 22,
}: {
  category: NewsCategory;
  maintenance?: boolean;
  size?: number;
}) {
  return maintenance ? (
    <IconTile icon={MaintenanceIcon} color={MAINTENANCE_META.color} size={size} />
  ) : (
    <IconTile icon={newsIcon(category)} color={NEWS_META[category].color} size={size} />
  );
}
