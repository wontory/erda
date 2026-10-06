import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

export const fetchCallsToday = async () => z.number().parse(await invoke<unknown>("nexon_calls_today"));
