import { describeError } from "@erda/api/errors";
import { CHARACTER_POSES, type CharacterPoseCode } from "@erda/core";
import { Sprite } from "@erda/ui/components/sprite";
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
import { Input } from "@erda/ui/components/ui/input";
import { ScrollArea } from "@erda/ui/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@erda/ui/components/ui/select";
import { Separator } from "@erda/ui/components/ui/separator";
import { fadeScale, listItem } from "@erda/ui/lib/motion";
import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";

import { useAccountCharacters } from "#/features/character/use-account-characters.ts";
import { useCharacterLook } from "#/features/character/use-character-look.ts";
import { useFavorites } from "#/features/character/use-favorites.ts";
import { useMainCharacter } from "#/features/character/use-main-character.ts";
import { useRecent } from "#/features/character/use-recent.ts";
import { useSetting } from "#/features/settings/use-settings.ts";
import { runAction, useAction } from "#/lib/action.ts";
import { isCommitEnter } from "#/lib/keys.ts";
import { ConfirmDialog } from "#/settings/confirm-dialog.tsx";
import { SettingNumber, SettingRow, SettingSwitch } from "#/settings/setting-row.tsx";

const SET_MAIN_FAILED = "본캐를 바꾸지 못했어요";
const SAVE_GROWTH_FAILED = "성장치를 저장하지 못했어요";
const SAVE_LOOK_FAILED = "캐릭터 이미지 설정을 저장하지 못했어요";
const POSE_ITEMS = CHARACTER_POSES.map((p) => ({ value: p.code, label: p.label }));

function AccountPicker({ onPick }: { onPick: (name: string) => void }) {
  const { byWorld } = useAccountCharacters();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>내 계정에서 고르기</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-0">
        <ScrollArea viewportClassName="max-h-80 p-1">
          {byWorld.map((g, i) => (
            <DropdownMenuGroup key={g.world}>
              {i > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel>{g.world}</DropdownMenuLabel>
              {g.characters.map((c) => (
                <DropdownMenuItem key={c.ocid} onClick={() => onPick(c.name)}>
                  {c.name}{" "}
                  <span className="ml-auto pl-3 text-[11px] text-muted-foreground">
                    Lv.{c.level} · {c.job}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MainCharacterRow() {
  const id = useId();
  const main = useMainCharacter();
  const [draft, setDraft] = useState<string | null>(null);
  const applying = useAction();
  const pick = (name: string) => {
    setDraft(null);
    return runAction(() => main.setMain(name), SET_MAIN_FAILED);
  };
  const apply = async () => {
    if (draft === null) return;
    const n = draft.trim();
    if (n !== main.name) {
      const ok = await applying.run(async () => {
        await main.setMain(n);
        return true;
      }, SET_MAIN_FAILED);
      if (!ok) return;
    }
    setDraft(null);
  };
  return (
    <SettingRow
      label="본캐 닉네임"
      htmlFor={`${id}-main`}
      description={
        <>
          {main.summary
            ? `${main.summary.name} · Lv.${main.summary.level} · ${main.summary.world}`
            : main.name
              ? main.isPending
                ? `${main.name} · …`
                : main.name
              : main.nameLoaded
                ? "비워 두면 내 계정에서 레벨이 가장 높은 캐릭터를 자동으로 골라요"
                : "…"}
          <AnimatePresence initial={false}>
            {main.error ? (
              <m.span key="error" {...listItem} className="block text-destructive">
                {describeError(main.error)}
              </m.span>
            ) : null}
          </AnimatePresence>
        </>
      }
    >
      <div className="flex shrink-0 items-center gap-2">
        <Input
          id={`${id}-main`}
          className="w-44"
          value={draft ?? main.name}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (isCommitEnter(e)) {
              e.preventDefault();
              void apply();
            }
          }}
          placeholder="닉네임"
          autoComplete="off"
          spellCheck={false}
        />
        <Button variant="outline" disabled={draft === null || applying.pending} onClick={apply}>
          적용
        </Button>
        <AccountPicker onPick={pick} />
      </div>
    </SettingRow>
  );
}

function FavoritesRow() {
  const { favorites, loaded, remove } = useFavorites();
  return (
    <SettingRow label="즐겨찾기" description={loaded && favorites.length === 0 ? "없음" : undefined}>
      <div className="flex shrink-0 flex-col items-end">
        <AnimatePresence initial={false}>
          {favorites.map((f) => (
            <m.div key={f.ocid} {...listItem}>
              <div className="flex items-center gap-2 py-0.5 text-[12px]">
                <span>
                  {f.name} <span className="text-muted-foreground">· {f.world}</span>
                </span>
                <Button
                  variant="ghost"
                  aria-label={`${f.name} 즐겨찾기 제거`}
                  onClick={() => runAction(() => remove(f.ocid), "즐겨찾기에서 제거하지 못했어요")}
                >
                  제거
                </Button>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </SettingRow>
  );
}

function RecentRow() {
  const { recent, loaded, clear } = useRecent();
  const [clearOpen, setClearOpen] = useState(false);
  return (
    <>
      <SettingRow label="최근 검색" description={loaded ? `${recent.length}개 저장됨` : "…"}>
        <Button variant="outline" disabled={recent.length === 0} onClick={() => setClearOpen(true)}>
          모두 지우기
        </Button>
      </SettingRow>
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="최근 검색을 모두 지울까요?"
        description="검색 기록이 이 기기에서 사라져요."
        confirmLabel="모두 지우기"
        failTitle="최근 검색을 지우지 못했어요"
        onConfirm={clear}
      />
    </>
  );
}

function SymbolGrowthRows() {
  const id = useId();
  const [arcane, setArcane] = useSetting("settings.arcaneDailyGrowth");
  const [authentic, setAuthentic] = useSetting("settings.authenticDailyGrowth");
  return (
    <>
      <h2 className="pt-3 pb-1 text-[12px] font-semibold text-muted-foreground">심볼 계산</h2>
      <SettingRow
        label="아케인 심볼 일일 성장치"
        htmlFor={`${id}-arcane`}
        description="만렙까지 남은 날을 계산할 때 하루에 얻는 성장치"
      >
        <SettingNumber
          id={`${id}-arcane`}
          value={arcane}
          min={1}
          max={60}
          onCommit={(v) => void runAction(() => setArcane(v), SAVE_GROWTH_FAILED)}
        />
      </SettingRow>
      <SettingRow label="어센틱 심볼 일일 성장치" htmlFor={`${id}-authentic`}>
        <SettingNumber
          id={`${id}-authentic`}
          value={authentic}
          min={1}
          max={60}
          onCommit={(v) => void runAction(() => setAuthentic(v), SAVE_GROWTH_FAILED)}
        />
      </SettingRow>
    </>
  );
}

function PosePreview({ image }: { image: string }) {
  const look = useCharacterLook(image);
  return <Sprite {...look} size={40} alt="" />;
}

function CharacterLookRows() {
  const id = useId();
  const main = useMainCharacter();
  const [pose, setPose, poseLoaded] = useSetting("settings.characterPose");
  const [animate, setAnimate, animateLoaded] = useSetting("settings.characterAnimate");
  return (
    <>
      <h2 className="pt-3 pb-1 text-[12px] font-semibold text-muted-foreground">캐릭터 이미지</h2>
      <SettingRow label="자세" description="홈 화면에 보이는 본캐의 자세">
        <div className="flex shrink-0 items-center gap-2">
          <div className="size-10 shrink-0">
            <AnimatePresence initial={false}>
              {main.summary ? (
                <m.div key="preview" {...fadeScale}>
                  <PosePreview image={main.summary.image} />
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>
          <Select
            items={POSE_ITEMS}
            value={pose}
            disabled={!poseLoaded}
            onValueChange={(v) => {
              if (v) void runAction(() => setPose(v as CharacterPoseCode), SAVE_LOOK_FAILED);
            }}
          >
            <SelectTrigger className="w-32" aria-label="자세">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSE_ITEMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingRow>
      <SettingRow
        label="움직이기"
        labelId={`${id}-animate-label`}
        htmlFor={`${id}-animate`}
        description="홈 화면의 본캐를 움직여요. 동작 줄이기를 켜 두면 멈춰 있어요"
      >
        <SettingSwitch
          id={`${id}-animate`}
          labelId={`${id}-animate-label`}
          checked={animateLoaded ? animate : null}
          onCheckedChange={(v) => void runAction(() => setAnimate(v), SAVE_LOOK_FAILED)}
        />
      </SettingRow>
    </>
  );
}

export function CharacterPage() {
  return (
    <div>
      <MainCharacterRow />
      <Separator />
      <FavoritesRow />
      <Separator />
      <RecentRow />
      <Separator />
      <CharacterLookRows />
      <Separator />
      <SymbolGrowthRows />
    </div>
  );
}
