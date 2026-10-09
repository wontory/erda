import { SIMULATOR_META, type SimulatorId } from "@erda/core";
import { ScreenHeader } from "@erda/ui/components/screen-header";

import { useNav } from "#/app/nav/context.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

import { PotentialSimulator } from "./potential/potential-simulator.tsx";
import { StarforceSimulator } from "./starforce/starforce-simulator.tsx";

function SimulatorBody({ simulator }: { simulator: SimulatorId }) {
  switch (simulator) {
    case "starforce":
      return <StarforceSimulator />;
    case "potential":
      return <PotentialSimulator />;
  }
}

export function SimulatorPage({ simulator }: { simulator: SimulatorId }) {
  const { pop } = useNav();
  return (
    <>
      <ScreenHeader
        title={SIMULATOR_META[simulator].title}
        parent="시뮬레이터"
        onBack={pop}
        onSettings={() => void openSettingsAction()}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <SimulatorBody simulator={simulator} />
      </div>
    </>
  );
}
