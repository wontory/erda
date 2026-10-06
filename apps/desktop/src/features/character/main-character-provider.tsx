import type { ReactNode } from "react";

import { MainCharacterContext, useMainCharacterState } from "./use-main-character.ts";

export function MainCharacterProvider({ children }: { children: ReactNode }) {
  const main = useMainCharacterState();
  return <MainCharacterContext.Provider value={main}>{children}</MainCharacterContext.Provider>;
}
