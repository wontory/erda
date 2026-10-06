import type { Settings, SettingsKey } from "@erda/core";
import { useEffect, useEffectEvent, useRef } from "react";

import { useSetting } from "./use-settings.ts";

export function useSettingChange<K extends SettingsKey>(
  key: K,
  onChange: (next: Settings[K], prev: Settings[K]) => void,
): void {
  const [value, , loaded] = useSetting(key);
  const previous = useRef<{ value: Settings[K] } | null>(null);
  const fire = useEffectEvent(onChange);
  useEffect(() => {
    if (!loaded) return;
    if (previous.current !== null && previous.current.value !== value) fire(value, previous.current.value);
    previous.current = { value };
  }, [value, loaded]);
}
