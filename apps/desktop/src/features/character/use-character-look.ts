import { characterLookFrames, characterPose } from "@erda/core";
import { useMemo } from "react";

import { useSetting } from "#/features/settings/use-settings.ts";

// Props for <Sprite> that draw `image` in the pose picked in settings. Only `animated` spots
// (the home card and its settings preview) move, and only while the setting is on.
export function useCharacterLook(image: string, { animated = false }: { animated?: boolean } = {}) {
  const [pose] = useSetting("settings.characterPose");
  const [animateSetting] = useSetting("settings.characterAnimate");
  const animate = animated && animateSetting;
  return useMemo(() => {
    const frames = characterLookFrames(image, pose, animate);
    return { src: image, frames, frameMs: characterPose(pose).frameMs };
  }, [image, pose, animate]);
}
