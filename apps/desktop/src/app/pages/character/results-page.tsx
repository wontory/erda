import { describeError } from "@erda/api/errors";
import type { CharacterSummary, FavoriteCharacter } from "@erda/core";
import { ErrorRow } from "@erda/ui/components/error-row";
import { LoadingRow } from "@erda/ui/components/loading-row";
import { Module } from "@erda/ui/components/module";
import { ScreenHeader } from "@erda/ui/components/screen-header";
import { Button } from "@erda/ui/components/ui/button";
import { listItem } from "@erda/ui/lib/motion";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Globe, Search, Star, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useNav } from "#/app/nav/context.ts";
import { pages } from "#/app/nav/stack.ts";
import { AccountCharactersModule } from "#/app/pages/character/parts/account-characters-module.tsx";
import { CharacterRow } from "#/app/pages/character/parts/character-row.tsx";
import { GuildHitRow } from "#/app/pages/character/parts/guild-hit-row.tsx";
import { EmptyState } from "#/app/pages/shared/empty-state.tsx";
import { SearchField } from "#/app/pages/shared/search-field.tsx";
import { resultsPageFor } from "#/app/pages/shared/search.ts";
import { characterKeys } from "#/features/character/queries.ts";
import { useAccountCharacters } from "#/features/character/use-account-characters.ts";
import { useFavorites } from "#/features/character/use-favorites.ts";
import { useRecent } from "#/features/character/use-recent.ts";
import { useCharacterSearch, useGuildSearch } from "#/features/character/use-search.ts";
import { runAction } from "#/lib/action.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

const CLEAR_RECENT_FAILED = "최근 검색을 지우지 못했어요";

function ResultsSearch({ query }: { query: string }) {
  const { push } = useNav();
  const [draft, setDraft] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div className="flex-1 px-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const page = resultsPageFor(draft);
          if (page) push(page);
        }}
      >
        <SearchField value={draft} onValueChange={setDraft} label="캐릭터 · 길드 이름 검색" inputRef={inputRef} />
      </form>
    </div>
  );
}

function AllWorldsHint({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="flex flex-col items-start gap-1 px-1">
      <Button variant="outline" size="xs" onClick={onSearch}>
        <Globe />
        모든 월드에서 길드 찾기
      </Button>
      <p className="text-[11px] text-muted-foreground">
        랭킹에 없는 길드는 월드를 하나씩 확인해서 넥슨 API 호출이 최대 18회 더 들어요.
      </p>
    </div>
  );
}

function RecentModule({
  recent,
  onOpen,
  onRemove,
  onClear,
}: {
  recent: FavoriteCharacter[];
  onOpen: (ocid: string, name: string) => void;
  onRemove: (ocid: string) => void;
  onClear: () => void;
}) {
  return (
    <Module
      title="최근 검색"
      icon={Clock}
      trailing={
        <Button variant="ghost" size="xs" onClick={onClear}>
          지우기
        </Button>
      }
    >
      <AnimatePresence initial={false}>
        {recent.map((r) => (
          <m.div key={r.ocid} {...listItem} className="overflow-hidden">
            <CharacterRow
              name={r.name}
              world={r.world}
              job={r.job}
              image={r.image}
              onClick={() => onOpen(r.ocid, r.name)}
              trailing={
                <Button variant="ghost" size="icon-xs" aria-label={`${r.name} 제거`} onClick={() => onRemove(r.ocid)}>
                  <X />
                </Button>
              }
            />
          </m.div>
        ))}
      </AnimatePresence>
    </Module>
  );
}

export function ResultsPage({ query }: { query: string }) {
  const { push, pop } = useNav();
  const [allWorlds, setAllWorlds] = useState(false);
  const character = useCharacterSearch(query);
  const guilds = useGuildSearch(query, { allWorlds });
  const { favorites } = useFavorites();
  const { recent, remove, clear, record } = useRecent();
  const { characters: account } = useAccountCharacters();
  const guildHits = guilds.data ?? [];
  const client = useQueryClient();
  const found = character.data;
  const openCharacter = (ocid: string, name: string) => push(pages.viewing(ocid, name));
  const openFound = (s: CharacterSummary) => {
    client.setQueryData(characterKeys.summary(s.ocid), s);
    void runAction(() => record(s), "최근 검색을 저장하지 못했어요");
    openCharacter(s.ocid, s.name);
  };
  const nothing = found === null && !guilds.isPending && !guilds.error && guildHits.length === 0;
  const noHistory = favorites.length === 0 && recent.length === 0 && account.length === 0;
  return (
    <>
      <ScreenHeader onBack={pop} onSettings={() => openSettingsAction()} leading={<ResultsSearch query={query} />} />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <Module title="캐릭터" icon={Search}>
          {character.isPending ? <LoadingRow label={`‘${query}’ 검색 중…`} /> : null}
          {character.error ? (
            <ErrorRow message={describeError(character.error)} onRetry={() => character.refetch()} />
          ) : null}
          {found ? (
            <CharacterRow
              name={found.name}
              world={found.world}
              job={found.job}
              image={found.image}
              level={found.level}
              onClick={() => openFound(found)}
            />
          ) : null}
          {nothing ? (
            <EmptyState icon={Search} title="결과 없음" description={`‘${query}’에 해당하는 캐릭터나 길드가 없어요`} />
          ) : null}
          {found === null && guildHits.length > 0 ? (
            <p className="px-2 py-1 text-[12px] text-muted-foreground">‘{query}’ 캐릭터는 없어요.</p>
          ) : null}
        </Module>
        {guilds.isPending ? (
          <Module>
            <LoadingRow label={allWorlds ? "모든 월드에서 길드 찾는 중…" : "길드 찾는 중…"} />
          </Module>
        ) : null}
        {guilds.error ? (
          <Module title="길드">
            <ErrorRow message={describeError(guilds.error)} onRetry={() => guilds.refetch()} />
          </Module>
        ) : null}
        {guildHits.length > 0 ? (
          <Module title={`길드 · ${guildHits.length}곳`}>
            {guildHits.map((h) => (
              <GuildHitRow key={`${h.world}|${h.name}`} hit={h} onClick={() => push(pages.guild(h.world, h.name))} />
            ))}
          </Module>
        ) : null}
        {!allWorlds && !guilds.isPending ? <AllWorldsHint onSearch={() => setAllWorlds(true)} /> : null}
        {favorites.length > 0 ? (
          <Module title="즐겨찾기" icon={Star}>
            {favorites.map((f) => (
              <CharacterRow
                key={f.ocid}
                name={f.name}
                world={f.world}
                job={f.job}
                image={f.image}
                onClick={() => openCharacter(f.ocid, f.name)}
              />
            ))}
          </Module>
        ) : null}
        {recent.length > 0 ? (
          <RecentModule
            recent={recent}
            onOpen={openCharacter}
            onRemove={(ocid) => runAction(() => remove(ocid), CLEAR_RECENT_FAILED)}
            onClear={() => runAction(clear, CLEAR_RECENT_FAILED)}
          />
        ) : null}
        {account.length > 0 ? <AccountCharactersModule characters={account} onOpen={openCharacter} /> : null}
        {!character.isPending && !guilds.isPending && noHistory && nothing ? (
          <p className="px-2 text-[12px] text-muted-foreground">닉네임이나 길드 이름을 정확히 입력해 주세요.</p>
        ) : null}
      </div>
    </>
  );
}
