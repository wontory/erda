// Raw image bytes for a character look URL. The desktop app routes this through its backend, since the
// webview always advertises `br` and Nexon's CDN keeps some of those variants cached as a blank placeholder.
type Fetcher = (src: string) => Promise<ArrayBuffer>;

let fetcher: Fetcher | null = null;

export function setSpriteFetcher(next: Fetcher) {
  fetcher = next;
}

export function spriteFetcher() {
  return fetcher;
}
