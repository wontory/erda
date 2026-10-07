import { AUCTION_FEES, type AuctionFee } from "@erda/core";
import { Module } from "@erda/ui/components/module";
import { Tabs, TabsList, TabsTrigger } from "@erda/ui/components/ui/tabs";
import { Coins } from "lucide-react";

import { MesoField } from "./meso-field.tsx";

export function AmountModule({
  fee,
  listing,
  net,
  onFee,
  onListing,
  onNet,
}: {
  fee: AuctionFee;
  listing: number;
  net: number;
  onFee: (fee: AuctionFee) => void;
  onListing: (value: number) => void;
  onNet: (value: number) => void;
}) {
  return (
    <Module title="판매 금액" icon={Coins}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5 text-[12px]">
          <span>경매장 수수료</span>
          <Tabs value={String(fee)} onValueChange={(v) => onFee(Number(v) as AuctionFee)}>
            <TabsList aria-label="경매장 수수료">
              {AUCTION_FEES.map((f) => (
                <TabsTrigger key={f} value={String(f)} className="px-2.5 tabular-nums">
                  {f}%
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <MesoField label="경매장 판매가" value={listing} onChange={onListing} />
        <MesoField label="실수령액" value={net} onChange={onNet} />
        <div className="px-0.5 text-[11px] text-muted-foreground">둘 중 하나만 넣으면 나머지는 수수료로 계산해요.</div>
      </div>
    </Module>
  );
}
