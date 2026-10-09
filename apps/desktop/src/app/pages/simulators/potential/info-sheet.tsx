import { POTENTIAL_RULES_DATE } from "@erda/core";

import { SheetBody, SheetHeader, SheetLayout, SheetTitle } from "#/sheet/sheet-layout.tsx";

export function InfoSheet({ dataDate }: { dataDate: string }) {
  return (
    <SheetLayout>
      <SheetHeader>
        <SheetTitle>규칙 안내</SheetTitle>
      </SheetHeader>
      <SheetBody>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-4 text-[12px] text-muted-foreground">
          <li>
            {POTENTIAL_RULES_DATE} 업데이트 기준 메소 재설정이에요. 옵션 확률표는 {dataDate}에 공식 확률 공개 페이지에서
            받아왔어요.
          </li>
          <li>부위·등급·착용 레벨마다 다른 옵션표를 쓰고, 2·3번째 줄에 한 등급 낮은 옵션이 나올 수 있어요.</li>
          <li>등급 상승 확률과 상승 보장 횟수는 공식 자료 기준이에요. 보장 횟수째 재설정에서 등급이 올라요.</li>
          <li>
            쓸만한 스킬·피격 후 무적시간은 한 줄, 피격 시 데미지 무시·무적은 두 줄까지만 나오고, 직전과 똑같은 결과는
            다시 굴려요.
          </li>
          <li>잠재능력·에디셔널 재설정 메소는 공식 자료, 소울 재설정 메소는 커뮤니티 수집값이에요(비공식).</li>
          <li>소울은 BEFORE/AFTER를 고를 수 있다고 가정했어요(비공식). 증폭 단계는 직접 골라야 해요.</li>
          <li>
            3회 재설정 버튼은 MVP 골드 이상 혜택이고 소울에도 있어요. 세 번 모두 BEFORE 등급에서 굴리고, 비용은 3배,
            상승 보장 횟수도 3회로 쳐요(비공식).
          </li>
          <li>확정 등급 상승까지 3회 미만으로 남으면 1회씩만 재설정할 수 있어요(비공식).</li>
          <li>
            레전드리에서는 자동 재설정 목표를 4개까지 정하고, 목표에 고른 옵션의 수치를 종류별로 더해 결과가 그 이상이면
            멈춰요. 올스탯 %는 STR·DEX·INT·LUK %에 함께 더해요(공식).
          </li>
          <li>
            자동 재설정은 목표 등급까지 오르는 결과를 적용하며 돌려요. 목표 등급을 레전드리로 고르면 목표 옵션도 정할 수
            있고, 인게임 자동 강화는 레전드리 장비에서만 쓸 수 있어요(비공식 확장).
          </li>
          <li>전투력 상승 시 재설정 중단 옵션은 캐릭터 전투력이 필요해서 지원하지 않아요.</li>
        </ul>
      </SheetBody>
    </SheetLayout>
  );
}
