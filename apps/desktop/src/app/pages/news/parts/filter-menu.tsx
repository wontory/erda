import { NEWS_CATEGORIES, NEWS_META, unreadCount, type NewsCategory, type NewsEntry } from "@erda/core";
import { Button } from "@erda/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@erda/ui/components/ui/dropdown-menu";
import { ListFilter } from "lucide-react";

export type NewsFilter = NewsCategory | "all";

const label = (title: string, n: number) => (n > 0 ? `${title} ${n}` : title);

export function FilterMenu({
  value,
  onChange,
  entries,
  seen,
}: {
  value: NewsFilter;
  onChange: (f: NewsFilter) => void;
  entries: NewsEntry[];
  seen: ReadonlySet<string>;
}) {
  const current = value === "all" ? "전체" : NEWS_META[value].title;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" aria-label={`필터: ${current}`} />}>
        <ListFilter />
        {current}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={(v: NewsFilter) => onChange(v)}>
          <DropdownMenuRadioItem value="all" closeOnClick>
            {label("전체", unreadCount(entries, seen))}
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {NEWS_CATEGORIES.map((c) => (
            <DropdownMenuRadioItem key={c} value={c} closeOnClick>
              {label(NEWS_META[c].title, unreadCount(entries, seen, c))}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
