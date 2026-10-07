import { equalRatios, listingOfNet, netOfListing, resizeRatios, splitBossMeso, type AuctionFee } from "@erda/core";
import { useState } from "react";

import { AmountModule } from "./amount-module.tsx";
import { PartyModule } from "./party-module.tsx";
import { ResultModule } from "./result-module.tsx";

type Amount = { basis: "listing" | "net"; value: number };

export function BossSplitCalculator() {
  const [fee, setFee] = useState<AuctionFee>(5);
  const [amount, setAmount] = useState<Amount>({ basis: "listing", value: 0 });
  const [count, setCount] = useState(2);
  const [byRatio, setByRatio] = useState(false);
  const [ratios, setRatios] = useState(() => equalRatios(2));

  const listing = amount.basis === "listing" ? amount.value : listingOfNet(amount.value, fee);
  const net = amount.basis === "net" ? amount.value : netOfListing(amount.value, fee);
  const split = splitBossMeso(net, byRatio ? ratios : equalRatios(count), fee);

  const changeCount = (n: number) => {
    setCount(n);
    setRatios((r) => resizeRatios(r, n));
  };
  const changeRatio = (index: number, value: number) => setRatios((r) => r.map((x, i) => (i === index ? value : x)));

  return (
    <>
      <AmountModule
        fee={fee}
        listing={listing}
        net={net}
        onFee={setFee}
        onListing={(value) => setAmount({ basis: "listing", value })}
        onNet={(value) => setAmount({ basis: "net", value })}
      />
      <PartyModule
        count={count}
        byRatio={byRatio}
        ratios={ratios}
        onCount={changeCount}
        onByRatio={setByRatio}
        onRatio={changeRatio}
      />
      <ResultModule split={split} byRatio={byRatio} />
    </>
  );
}
