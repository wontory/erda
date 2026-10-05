const NAMED: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

const isValidCodePoint = (n: number) => Number.isFinite(n) && n >= 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff);

function fromCodePoint(digits: string, radix: number): string | undefined {
  const n = parseInt(digits, radix);
  return isValidCodePoint(n) ? String.fromCodePoint(n) : undefined;
}

function decode(entity: string): string | undefined {
  const code = entity.toLowerCase();
  if (code.startsWith("#x")) return fromCodePoint(code.slice(2), 16);
  if (code.startsWith("#")) return fromCodePoint(code.slice(1), 10);
  return NAMED[code];
}

export function htmlToText(html: string): string {
  try {
    let s = html.replace(/\r\n?/g, "\n");
    s = s.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
    s = s.replace(/<\s*br\s*\/?>/gi, "\n");
    s = s.replace(/<li\b[^>]*>/gi, "• ");
    s = s.replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|table|section|article)\s*>/gi, "\n");
    s = s.replace(/<(?:"[^"]*"|'[^']*'|[^>"'])*>/g, "");
    s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => decode(code) ?? m);
    s = s.replace(/\u00a0/g, " ");
    s = s
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n");
    s = s.replace(/\n{3,}/g, "\n\n");
    return s.trim();
  } catch {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

export function clampLines(text: string, max = 40): { text: string; truncated: boolean } {
  const lines = text.split("\n");
  if (lines.length <= max) return { text, truncated: false };
  return { text: lines.slice(0, max).join("\n"), truncated: true };
}
