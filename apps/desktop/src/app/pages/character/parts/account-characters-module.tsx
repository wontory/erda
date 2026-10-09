import type { AccountCharacter } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@erda/ui/components/ui/collapsible";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@erda/ui/components/ui/item";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { useState } from "react";

import { ItemValue } from "#/app/pages/shared/item-value.tsx";

export function AccountCharactersModule({
  characters,
  onOpen,
}: {
  characters: AccountCharacter[];
  onOpen: (ocid: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Module title={`내 계정 캐릭터 ${characters.length}명`} icon={Users}>
        <CollapsibleTrigger render={<Button variant="ghost" />}>
          <ChevronDown
            className="transition-transform duration-200 ease-snappy in-aria-expanded:rotate-180 motion-reduce:transition-none"
            aria-hidden
          />
          {open ? "접기" : "펼치기"}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {characters.map((c) => (
            <Item
              key={c.ocid}
              size="row"
              render={(props) => <button type="button" {...props} />}
              onClick={() => onOpen(c.ocid, c.name)}
            >
              <ItemContent>
                <ItemTitle>{c.name}</ItemTitle>
                <ItemDescription>{`${c.world} · ${c.job}`}</ItemDescription>
              </ItemContent>
              <ItemValue>{`Lv.${c.level}`}</ItemValue>
              <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
            </Item>
          ))}
        </CollapsibleContent>
      </Module>
    </Collapsible>
  );
}
