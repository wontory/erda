import { STARFORCE_RULES_DATE } from "@erda/core";

import { SheetBody, SheetHeader, SheetLayout, SheetTitle } from "#/sheet/sheet-layout.tsx";

export function InfoSheet() {
  return (
    <SheetLayout>
      <SheetHeader>
        <SheetTitle>규칙 안내</SheetTitle>
      </SheetHeader>
      <SheetBody>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-4 text-[12px] text-muted-foreground">
          <li>{STARFORCE_RULES_DATE} 업데이트 기준이에요. 스타캐치 보너스는 항상 적용돼요.</li>
          <li>확률, 최대 성, MVP·PC방 할인율, 파괴 방지 비용은 공식 자료 기준이에요.</li>
          <li>10성 이상 강화 비용과 확정 복구 메소는 공식 자료가 없어 커뮤니티 수집값을 써요(비공식).</li>
          <li>MVP와 PC방 할인은 더해서 적용해요(비공식).</li>
          <li>이벤트는 직접 켜고 꺼야 해요. 진행 중인 이벤트를 자동으로 알지 못해요.</li>
        </ul>
      </SheetBody>
    </SheetLayout>
  );
}
