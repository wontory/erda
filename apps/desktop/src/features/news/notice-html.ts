import DOMPurify from "dompurify";

const BASE_URL = "https://maplestory.nexon.com/";

const purify = DOMPurify(window);

purify.addHook("afterSanitizeAttributes", (node) => {
  if (node instanceof HTMLImageElement) {
    const src = toHttps(node.getAttribute("src"));
    if (!src || !isNexonHost(src)) return node.remove();
    node.setAttribute("src", src.href);
    node.setAttribute("loading", "lazy");
    node.setAttribute("decoding", "async");
    return;
  }
  node.removeAttribute("width");
  node.removeAttribute("height");
  if (node instanceof HTMLAnchorElement) {
    const href = toHttps(node.getAttribute("href"));
    if (href) node.setAttribute("href", href.href);
    else node.removeAttribute("href");
  }
});

function toHttps(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim(), BASE_URL);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isNexonHost(url: URL): boolean {
  return url.hostname === "nexon.com" || url.hostname.endsWith(".nexon.com");
}

export interface NoticeHtml {
  html: string;
  empty: boolean;
}

export function sanitizeNoticeHtml(dirty: string): NoticeHtml {
  const fragment = purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p",
      "div",
      "span",
      "br",
      "hr",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "colspan", "rowspan", "width", "height"],
    RETURN_DOM_FRAGMENT: true,
  });
  const empty = !fragment.textContent?.trim() && !fragment.querySelector("img");
  const holder = document.createElement("div");
  holder.append(fragment);
  return { html: holder.innerHTML, empty };
}
