import { describeError } from "@erda/api/errors";
import type { GuildBasic } from "@erda/api/generated/model";
import { AutoHeight } from "@erda/ui/components/auto-height";
import { ErrorRow } from "@erda/ui/components/error-row";
import { Module } from "@erda/ui/components/module";
import { Button } from "@erda/ui/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@erda/ui/components/ui/item";
import { Spinner } from "@erda/ui/components/ui/spinner";
import { listItem } from "@erda/ui/lib/motion";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Crown, User } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { pages } from "#/app/nav/stack.ts";
import { SearchField } from "#/app/pages/shared/search-field.tsx";
import { characterKeys, fetchSummary, lookupOcid } from "#/features/character/queries.ts";
import { useRecent } from "#/features/character/use-recent.ts";

const MAX_MEMBERS = 200;

function useMounted() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

function useOpenMember() {
  const { push } = useNav();
  const client = useQueryClient();
  const { record } = useRecent();
  const mounted = useMounted();
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = async (member: string) => {
    if (opening) return;
    setOpening(member);
    setError(null);
    try {
      const ocid = await lookupOcid(member);
      const summary = await fetchSummary(ocid);
      client.setQueryData(characterKeys.summary(ocid), summary);
      await record(summary);
      if (mounted.current) push(pages.viewing(ocid, member));
    } catch (e) {
      if (mounted.current) setError(describeError(e));
    } finally {
      if (mounted.current) setOpening(null);
    }
  };
  return { opening, error, open };
}

function MemberRow({
  name,
  isMaster,
  opening,
  onOpen,
}: {
  name: string;
  isMaster: boolean;
  opening: string | null;
  onOpen: () => void;
}) {
  return (
    <Item
      size="row"
      render={(props) => (
        <button
          type="button"
          {...props}
          aria-disabled={opening ? true : undefined}
          aria-busy={opening === name ? true : undefined}
        />
      )}
      onClick={onOpen}
    >
      <ItemMedia>
        {isMaster ? (
          <Crown size={16} className="text-primary" aria-hidden />
        ) : (
          <User size={16} className="text-muted-foreground" aria-hidden />
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        {isMaster ? <ItemDescription>마스터</ItemDescription> : null}
      </ItemContent>
      {opening === name ? <Spinner className="size-3.5" /> : null}
      {opening ? null : <ChevronRight size={14} className="text-muted-foreground" aria-hidden />}
    </Item>
  );
}

export function GuildMembersModule({ guild: g }: { guild: GuildBasic }) {
  const [filter, setFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);
  const { opening, error, open } = useOpenMember();
  const needle = filter.trim();
  const members = (g.guild_member ?? [])
    .slice(0, MAX_MEMBERS)
    .filter((name) => name.toLowerCase().includes(needle.toLowerCase()));
  const clearFilter = () => {
    setFilter("");
    filterRef.current?.focus();
  };
  return (
    <Module title={`길드원 ${g.guild_member?.length ?? 0}명`}>
      <SearchField
        value={filter}
        onValueChange={setFilter}
        label="길드원 검색"
        inputRef={filterRef}
        className="mb-2 h-8"
        icon={false}
      />
      <AutoHeight>
        <AnimatePresence initial={false}>
          {error ? (
            <m.div key="error" {...listItem}>
              <ErrorRow message={error} />
            </m.div>
          ) : null}
          {members.length === 0 && needle ? (
            <m.div key="empty" {...listItem}>
              <div className="flex items-center justify-between gap-2 px-2 py-1 text-[12px] text-muted-foreground">
                <span className="min-w-0 truncate">‘{needle}’와 일치하는 길드원이 없어요</span>
                <Button variant="ghost" onClick={clearFilter}>
                  검색 지우기
                </Button>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
        {members.map((name) => (
          <MemberRow
            key={name}
            name={name}
            isMaster={name === g.guild_master_name}
            opening={opening}
            onOpen={() => open(name)}
          />
        ))}
      </AutoHeight>
    </Module>
  );
}
