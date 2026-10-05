import { invoke } from "@tauri-apps/api/core";

import { NexonError, errorText } from "./errors.ts";

export type NexonCachePolicy = "useCache" | "refresh" | "ignore";

export type NexonRequestInit = RequestInit & { nexonCache?: NexonCachePolicy };

export type ErrorType<E> = NexonError & { body?: E };

const NEXON_BASE_URL = "https://open.api.nexon.com";

async function requestText(path: string, query: Record<string, string>, policy: NexonCachePolicy): Promise<string> {
  try {
    return await invoke<string>("nexon_request", { path, query, policy });
  } catch (e) {
    const error = NexonError.from(e);
    console.error("nexon_request failed", path, error.kind, error.code ?? "", error.detail);
    throw error;
  }
}

function parseJson<T>(path: string, text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("nexon response is not JSON", path, e);
    throw new NexonError({ kind: "parse", message: errorText(e) });
  }
}

export const nexonFetch = async <T>(url: string, init?: NexonRequestInit): Promise<T> => {
  const { pathname, searchParams } = new URL(url, NEXON_BASE_URL);
  const query = Object.fromEntries(searchParams);
  const text = await requestText(pathname, query, init?.nexonCache ?? "useCache");
  return parseJson<T>(pathname, text);
};
