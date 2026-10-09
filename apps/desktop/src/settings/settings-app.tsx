import { IconTile } from "@erda/ui/components/icon-tile";
import { Swap } from "@erda/ui/components/swap";
import { Info, Settings2, Timer, User, type LucideIcon } from "lucide-react";
import { m } from "motion/react";
import { useState, type ComponentType } from "react";
import { z } from "zod";

import { useTauriEvent } from "#/lib/use-tauri-event.ts";
import { AboutPage } from "#/settings/pages/about-page.tsx";
import { CharacterPage } from "#/settings/pages/character-page.tsx";
import { GeneralPage } from "#/settings/pages/general-page.tsx";
import { TimerPage } from "#/settings/pages/timer-page.tsx";

import { parseSettingsPage, type SettingsPageId } from "./page-id.ts";

const anyPayload = z.unknown();

const PAGES: Array<{ id: SettingsPageId; title: string; icon: LucideIcon; color: string; Page: ComponentType }> = [
  { id: "general", title: "일반", icon: Settings2, color: "bg-gray-500", Page: GeneralPage },
  { id: "character", title: "캐릭터", icon: User, color: "bg-blue-500", Page: CharacterPage },
  { id: "timer", title: "타이머", icon: Timer, color: "bg-orange-500", Page: TimerPage },
  { id: "about", title: "정보", icon: Info, color: "bg-gray-500", Page: AboutPage },
];

const initialPage = () => parseSettingsPage(new URLSearchParams(location.search).get("page")) ?? "general";

export function SettingsApp() {
  const [page, setPage] = useState<SettingsPageId>(initialPage);
  useTauriEvent("settings:page", anyPayload, (payload) => {
    const next = parseSettingsPage(payload);
    if (next) setPage(next);
  });
  const current = PAGES.find((p) => p.id === page)!;
  return (
    <div className="flex h-screen bg-background text-foreground">
      <nav aria-label="설정" className="w-[200px] shrink-0 border-r border-border bg-sidebar p-2">
        {PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPage(p.id)}
            aria-current={p.id === page ? "page" : undefined}
            className={`relative isolate flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-100 ${p.id === page ? "" : "hover:bg-sidebar-accent/60"}`}
          >
            {p.id === page ? (
              <m.span layoutId="settings-nav-active" className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent" />
            ) : null}
            <IconTile icon={p.icon} color={p.color} size={20} />
            {p.title}
          </button>
        ))}
      </nav>
      <main className="min-w-0 flex-1">
        <m.div layoutScroll className="relative scrollbar-none h-full overflow-y-auto">
          <Swap id={page} className="px-6 py-4">
            <h1 className="mb-3 text-[17px] font-semibold">{current.title}</h1>
            <current.Page />
          </Swap>
        </m.div>
      </main>
    </div>
  );
}
