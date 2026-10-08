import { SIMULATOR_META, type SimulatorId } from "@erda/core";
import { ScreenHeader } from "@erda/ui/components/screen-header";

import { useNav } from "#/app/nav/context.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

import { StarforceSimulator } from "./starforce/starforce-simulator.tsx";

function SimulatorBody({ simulator }: { simulator: SimulatorId }) {
  switch (simulator) {
    case "starforce":
      return <StarforceSimulator />;
  }
}

export function SimulatorPage({ simulator }: { simulator: SimulatorId }) {
  const { pop } = useNav();
  return (
    <>
      <ScreenHeader
        title={SIMULATOR_META[simulator].title}
        subtitle="시뮬레이터"
        onBack={pop}
        onSettings={() => void openSettingsAction()}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <SimulatorBody simulator={simulator} />
      </div>
    </>
  );
}
