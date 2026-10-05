import { z } from "zod";

export const nexonErrorKindSchema = z.enum([
  "api",
  "network",
  "missingApiKey",
  "emptyResponse",
  "unexpectedStatus",
  "invalidParameter",
  "parse",
]);
export type NexonErrorKind = z.infer<typeof nexonErrorKindSchema>;

export interface NexonErrorPayload {
  kind: NexonErrorKind;
  code?: string;
  message: string;
  status?: number;
}

const payloadSchema = z.object({
  kind: nexonErrorKindSchema.catch("network"),
  code: z.string().optional().catch(undefined),
  message: z.string().catch(""),
  status: z.number().optional().catch(undefined),
});

const FRIENDLY_BY_CODE: Record<string, string> = {
  OPENAPI00001: "넥슨 서버에 문제가 있어요. 잠시 뒤에 다시 시도해 주세요.",
  OPENAPI00002: "이 API 키로는 조회할 수 없는 정보예요.",
  OPENAPI00003: "식별자가 올바르지 않아요.",
  OPENAPI00004: "대상을 찾을 수 없어요.",
  OPENAPI00005: "API 키가 올바르지 않아요.",
  OPENAPI00006: "요청 경로가 올바르지 않아요.",
  OPENAPI00007: "호출량이 많아요. 잠시 뒤에 다시 시도해 주세요.",
  OPENAPI00009: "넥슨이 데이터를 준비하는 중이에요.",
  OPENAPI00010: "게임 점검 중이에요.",
  OPENAPI00011: "넥슨 API 점검 중이에요.",
};

export const MISSING_API_KEY_MESSAGE = "넥슨 Open API 키를 설정에서 먼저 입력해 주세요.";
const UNKNOWN_MESSAGE = "요청을 처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";
const NOT_FOUND_CODE = "OPENAPI00004";
const HANGUL = /[\uac00-\ud7a3]/;

export const errorText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function friendlyMessage(code: string): string {
  return FRIENDLY_BY_CODE[code] ?? `${UNKNOWN_MESSAGE} (${code})`;
}

export class NexonError extends Error {
  readonly kind: NexonErrorKind;
  readonly code?: string;
  readonly status?: number;
  readonly detail: string;

  constructor(payload: NexonErrorPayload) {
    super(NexonError.messageFor(payload));
    this.name = "NexonError";
    this.kind = payload.kind;
    this.code = payload.code;
    this.status = payload.status;
    this.detail = payload.message;
  }

  private static messageFor(p: NexonErrorPayload): string {
    switch (p.kind) {
      case "api":
        return p.code ? friendlyMessage(p.code) : UNKNOWN_MESSAGE;
      case "missingApiKey":
        return MISSING_API_KEY_MESSAGE;
      case "emptyResponse":
        return "응답에 필요한 값이 없어요.";
      case "unexpectedStatus":
        return `서버 응답 오류 (HTTP ${p.status ?? "?"})`;
      case "invalidParameter":
        return "지원하지 않는 요청이에요.";
      case "parse":
        return "넥슨 응답을 읽을 수 없어요. 잠시 뒤에 다시 시도해 주세요.";
      case "network":
        return "네트워크에 연결할 수 없어요.";
    }
  }

  static from(raw: unknown): NexonError {
    if (raw instanceof NexonError) return raw;
    if (typeof raw === "object" && raw !== null && "kind" in raw) {
      const parsed = payloadSchema.safeParse(raw);
      if (parsed.success) return new NexonError(parsed.data);
    }
    return new NexonError({ kind: "network", message: errorText(raw) });
  }
}

export const isNotFound = (e: unknown): boolean =>
  e instanceof NexonError && (e.code === NOT_FOUND_CODE || e.kind === "emptyResponse");

const isAppAuthoredError = (e: unknown): e is Error =>
  !(e instanceof NexonError) && e instanceof Error && HANGUL.test(e.message);

export const describeError = (e: unknown): string => (isAppAuthoredError(e) ? e.message : NexonError.from(e).message);
