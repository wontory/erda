import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: 5173, strictPort: true, watch: { ignored: ["**/src-tauri/**"] } },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: ["safari16", "chrome105"],
    rollupOptions: {
      input: {
        main: page("index"),
        hud: page("hud"),
        settings: page("settings"),
        inspector: page("inspector"),
        sheet: page("sheet"),
      },
    },
  },
});
