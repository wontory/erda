import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useRef, useState } from "react";

import type { SettingsPageId } from "#/settings/page-id.ts";

import { runAction } from "./action.ts";
import { useTauriSignal } from "./use-tauri-event.ts";

export function usePanelVisibility(): boolean {
  const [visible, setVisible] = useState(false);
  const seeded = useRef(false);
  const show = (next: boolean) => {
    seeded.current = true;
    setVisible(next);
  };
  useTauriSignal("panel:shown", () => show(true));
  useTauriSignal("panel:hiding", () => show(false));
  useEffect(() => {
    let cancelled = false;
    getCurrentWindow()
      .isVisible()
      .then((v) => {
        if (!cancelled && !seeded.current) setVisible(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return visible;
}

export const openSettings = (page?: SettingsPageId) => invoke<void>("open_settings", { page: page ?? null });

export const openSettingsAction = (page?: SettingsPageId) =>
  runAction(() => openSettings(page), "설정을 열지 못했어요");

export const NEXON_OPEN_API_URL = "https://openapi.nexon.com/";
export const NEXON_APP_URL = "https://openapi.nexon.com/ko/my-application/";
export const MAPLESTORY_URL = "https://maplestory.nexon.com/";

export const openExternal = (url: string) => runAction(() => openUrl(url), "링크를 열지 못했어요");
