type Fetcher = (src: string) => Promise<ArrayBuffer>;

let fetcher: Fetcher | null = null;

export function setSpriteFetcher(next: Fetcher) {
  fetcher = next;
}

export function spriteFetcher() {
  return fetcher;
}
