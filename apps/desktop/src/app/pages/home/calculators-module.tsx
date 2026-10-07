import { CALCULATOR_IDS, CALCULATOR_META, type CalculatorId } from "@erda/core";
import { IconTile } from "@erda/ui/components/icon-tile";
import { Module } from "@erda/ui/components/module";
import { Calculator } from "lucide-react";

import { LinkRow } from "#/app/pages/shared/link-row.tsx";
import { calculatorIcon } from "#/features/calculators/icons.ts";

export function CalculatorsModule({ onOpen }: { onOpen: (id: CalculatorId) => void }) {
  return (
    <Module title="계산기" icon={Calculator}>
      {CALCULATOR_IDS.map((id) => (
        <LinkRow
          key={id}
          media={<IconTile icon={calculatorIcon(id)} color={CALCULATOR_META[id].color} size={22} />}
          title={CALCULATOR_META[id].title}
          value={CALCULATOR_META[id].summary}
          onClick={() => onOpen(id)}
        />
      ))}
    </Module>
  );
}
