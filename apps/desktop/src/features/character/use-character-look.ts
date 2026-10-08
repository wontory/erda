import { characterLookFrames, characterPose } from "@erda/core";
import { useMemo } from "react";

import { useSetting } from "#/features/settings/use-settings.ts";

export function useCharacterLook(image: string) {
  const [pose] = useSetting("settings.characterPose");
  const [animate] = useSetting("settings.characterAnimate");
  return useMemo(() => {
    const frames = characterLookFrames(image, pose, animate);
    return { src: image, frames, frameMs: characterPose(pose).frameMs };
  }, [image, pose, animate]);
}
