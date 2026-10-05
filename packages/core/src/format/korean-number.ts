const MAN = 1_0000;
const EOK = 1_0000_0000;
const JO = 1_0000_0000_0000;

const UNITS: ReadonlyArray<readonly [size: number, label: string]> = [
  [JO, "조"],
  [EOK, "억"],
  [MAN, "만"],
];

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export const KoreanNumber = {
  format(n: number): string {
    if (!Number.isFinite(n)) return "-";
    const sign = n < 0 ? "-" : "";
    let rest = Math.abs(Math.trunc(n));
    if (rest === 0) return "0";
    const parts: string[] = [];
    for (const [unit, label] of UNITS) {
      const q = Math.floor(rest / unit);
      if (q > 0) parts.push(`${q}${label}`);
      rest %= unit;
    }
    if (rest > 0) parts.push(String(rest));
    return sign + parts.join(" ");
  },
  compact(n: number): string {
    if (!Number.isFinite(n)) return "-";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= JO) return `${sign}${trimDecimal(abs / JO)}조`;
    if (abs >= EOK) return `${sign}${trimDecimal(abs / EOK)}억`;
    if (abs >= MAN) return `${sign}${Math.floor(abs / MAN)}만`;
    return `${sign}${Math.trunc(abs)}`;
  },
  grouped(n: number): string {
    return Number.isFinite(n) ? Math.trunc(n).toLocaleString("en-US") : "-";
  },
  truncateToMan(n: number): string {
    if (Math.abs(n) >= EOK) return KoreanNumber.format(Math.trunc(n / MAN) * MAN);
    return KoreanNumber.format(n);
  },
};
