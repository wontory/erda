import { useState } from "react";

export function useImageStatus(src: string | null | undefined) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  return {
    failed: !src || failedSrc === src,
    loaded: !!src && loadedSrc === src,
    onLoad: () => setLoadedSrc(src ?? null),
    onError: () => setFailedSrc(src ?? null),
  };
}
