import { SIMULATOR_IDS, SIMULATOR_META, type SimulatorId } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Module } from "@erda/ui/components/module";
import { Gamepad2 } from "lucide-react";

import { LinkRow } from "#/app/pages/shared/link-row.tsx";
import { simulatorIcon } from "#/features/simulators/icons.ts";

export function SimulatorsModule({ onOpen }: { onOpen: (id: SimulatorId) => void }) {
  return (
    <Module title="시뮬레이터" icon={Gamepad2}>
      {SIMULATOR_IDS.map((id) => (
        <LinkRow
          key={id}
          media={<IconTile icon={simulatorIcon(id)} color={SIMULATOR_META[id].color} size={22} />}
          title={SIMULATOR_META[id].title}
          value={SIMULATOR_META[id].summary}
          onClick={() => onOpen(id)}
        />
      ))}
    </Module>
  );
}
