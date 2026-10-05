import { platform } from "@tauri-apps/plugin-os";

export function applyPlatform(name: string, root: HTMLElement = document.documentElement) {
  root.dataset.platform = name;
}

export async function startPlatform() {
  try {
    applyPlatform(platform());
  } catch {
    applyPlatform("unknown");
  }
}
