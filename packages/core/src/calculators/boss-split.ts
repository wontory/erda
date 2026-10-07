export const AUCTION_FEES = [5, 3, 0] as const;
export type AuctionFee = (typeof AUCTION_FEES)[number];

export const PARTY_SIZES = [2, 3, 4, 5, 6] as const;
export const MAX_MESO = 999_999_999_999_999;
export const MAX_RATIO = 999;

const ROUND_UNIT = 100n;

const toMeso = (n: number): bigint => BigInt(Math.min(MAX_MESO, Math.max(0, Math.trunc(n))));

export const netOfListing = (listing: number, fee: AuctionFee): number =>
  Number((toMeso(listing) * BigInt(100 - fee)) / 100n);

export function listingOfNet(net: number, fee: AuctionFee): number {
  const keep = BigInt(100 - fee);
  return Number((toMeso(net) * 100n + keep - 1n) / keep);
}

export const splitRoleLabel = (index: number, total: number): string => {
  if (index === 0) return "파티장";
  return total === 2 ? "파티원" : `파티원${index}`;
};

export interface SplitShare {
  label: string;
  ratio: number;
  percent: number;
  amount: number;
  received: number;
}

export interface BossSplit {
  leader: SplitShare;
  members: SplitShare[];
  gap: number;
  gapRate: number;
}

export const equalRatios = (count: number): number[] => Array.from({ length: count }, () => 1);

export function resizeRatios(ratios: number[], count: number): number[] {
  return Array.from({ length: count }, (_, i) => ratios[i] ?? 1);
}

export function splitBossMeso(net: number, ratios: number[], fee: AuctionFee): BossSplit | null {
  const amount = toMeso(net);
  const weights = ratios.map((r) => BigInt(Math.min(MAX_RATIO, Math.max(0, Math.trunc(r)))));
  if (amount === 0n || weights.length < 2) return null;
  const total = weights.reduce((a, b) => a + b, 0n);
  if (total === 0n) return null;
  const keep = BigInt(100 - fee);
  const [leaderWeight, ...memberWeights] = weights;
  const memberTotal = total - leaderWeight;
  const denominator = leaderWeight * keep + 100n * memberTotal;
  const count = weights.length;
  const percent = (w: bigint) => (Number(w) / Number(total)) * 100;
  const members = memberWeights.map((w, i): SplitShare => {
    const transfer = ((amount * w) / denominator) * ROUND_UNIT;
    return {
      label: splitRoleLabel(i + 1, count),
      ratio: Number(w),
      percent: percent(w),
      amount: Number(transfer),
      received: Number((transfer * keep) / 100n),
    };
  });
  const leaderAmount = Number(amount) - members.reduce((sum, m) => sum + m.amount, 0);
  const leader: SplitShare = {
    label: splitRoleLabel(0, count),
    ratio: Number(leaderWeight),
    percent: percent(leaderWeight),
    amount: leaderAmount,
    received: leaderAmount,
  };
  const gap = leaderAmount - (members[0]?.received ?? 0);
  return { leader, members, gap, gapRate: leaderAmount > 0 ? (gap / leaderAmount) * 100 : 0 };
}
