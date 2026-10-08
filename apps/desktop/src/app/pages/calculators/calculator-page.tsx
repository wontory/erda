import { CALCULATOR_META, type CalculatorId } from "@erda/core";
import { ScreenHeader } from "@erda/ui/components/screen-header";

import { useNav } from "#/app/nav/context.ts";
import { openSettingsAction } from "#/lib/tauri.ts";

import { BossSplitCalculator } from "./boss-split/boss-split-calculator.tsx";
import { StarforceCalculator } from "./starforce/starforce-calculator.tsx";

function CalculatorBody({ calculator }: { calculator: CalculatorId }) {
  switch (calculator) {
    case "boss-split":
      return <BossSplitCalculator />;
    case "starforce":
      return <StarforceCalculator />;
  }
}

export function CalculatorPage({ calculator }: { calculator: CalculatorId }) {
  const { pop } = useNav();
  return (
    <>
      <ScreenHeader
        title={CALCULATOR_META[calculator].title}
        subtitle="계산기"
        onBack={pop}
        onSettings={() => void openSettingsAction()}
      />
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <CalculatorBody calculator={calculator} />
      </div>
    </>
  );
}
