import { Button } from "@erda/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@erda/ui/components/ui/dropdown-menu";
import { Users } from "lucide-react";

import { useAccountCharacters } from "#/features/character/use-account-characters.ts";

export function AccountMenu({ currentName, onPick }: { currentName: string; onPick: (name: string) => void }) {
  const { byWorld } = useAccountCharacters();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="내 계정 캐릭터" title="내 계정 캐릭터" />}
      >
        <Users />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-auto min-w-48 overflow-y-auto">
        {byWorld.length === 0 ? <DropdownMenuItem disabled>계정 캐릭터 없음</DropdownMenuItem> : null}
        {byWorld.map((g, i) => (
          <DropdownMenuGroup key={g.world}>
            {i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{g.world}</DropdownMenuLabel>
            {g.characters.map((c) => (
              <DropdownMenuItem key={c.ocid} disabled={c.name === currentName} onClick={() => onPick(c.name)}>
                {c.name}{" "}
                <span className="ml-auto pl-3 text-[11px] text-muted-foreground">
                  Lv.{c.level} · {c.job}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
