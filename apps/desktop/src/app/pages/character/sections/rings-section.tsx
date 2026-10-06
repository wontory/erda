import { NexonError } from "@erda/api/errors";
import {
  getCharacterRingExchangeSkillEquipment,
  getCharacterRingReserveSkillEquipment,
} from "@erda/api/generated/endpoints/character/character";
import type { NexonCachePolicy } from "@erda/api/mutator";
import { CircleDot } from "lucide-react";

import { SectionNote } from "./section-text.tsx";
import { Section } from "./section.tsx";
import { SkillRow } from "./skill-section.tsx";

async function fetchRings(ocid: string, policy: NexonCachePolicy) {
  const [ex, re] = await Promise.allSettled([
    getCharacterRingExchangeSkillEquipment({ ocid }, { nexonCache: policy }),
    getCharacterRingReserveSkillEquipment({ ocid }, { nexonCache: policy }),
  ]);
  if (ex.status === "rejected" && re.status === "rejected") throw NexonError.from(ex.reason);
  return {
    exchange: ex.status === "fulfilled" ? ex.value : null,
    reserve: re.status === "fulfilled" ? re.value : null,
  };
}

export function RingsSection({ ocid }: { ocid: string }) {
  return (
    <Section id="rings" ocid={ocid} icon={CircleDot} fetcher={(p) => fetchRings(ocid, p)}>
      {({ exchange, reserve }) => (
        <>
          {exchange?.special_ring_exchange_name ? (
            <SkillRow
              icon={exchange.special_ring_exchange_icon}
              name={`교환 반지 · ${exchange.special_ring_exchange_name}`}
              level={exchange.special_ring_exchange_level}
              effect={exchange.special_ring_exchange_description}
            />
          ) : null}
          {reserve?.special_ring_reserve_name ? (
            <SkillRow
              icon={reserve.special_ring_reserve_icon}
              name={`예약 반지 · ${reserve.special_ring_reserve_name}`}
              level={reserve.special_ring_reserve_level}
              effect={reserve.special_ring_reserve_description}
            />
          ) : null}
          {!exchange?.special_ring_exchange_name && !reserve?.special_ring_reserve_name ? (
            <SectionNote>특수 반지 없음</SectionNote>
          ) : null}
        </>
      )}
    </Section>
  );
}
