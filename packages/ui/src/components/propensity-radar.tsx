const AXES = 6;
const RINGS = [0.25, 0.5, 0.75, 1];

type Point = readonly [number, number];

const toPoints = (points: Point[]) => points.map((p) => p.join(",")).join(" ");

export function PropensityRadar({ values, labels, size = 230 }: { values: number[]; labels: string[]; size?: number }) {
  const c = size / 2;
  const r = size * 0.36;
  const point = (i: number, ratio: number): Point => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / AXES;
    return [c + Math.cos(angle) * r * ratio, c + Math.sin(angle) * r * ratio];
  };
  const ring = (ratio: number) => toPoints(Array.from({ length: AXES }, (_, i) => point(i, ratio)));
  const data = values.map((v, i) => point(i, Math.min(100, Math.max(0, v)) / 100));
  const summary = labels.map((l, i) => `${l} ${values[i]}`).join(", ");
  return (
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {RINGS.map((ratio) => (
          <polygon
            key={ratio}
            points={ring(ratio)}
            fill="none"
            className={ratio === 1 ? "stroke-foreground/25" : "stroke-foreground/10"}
            strokeWidth={1}
          />
        ))}
        <polygon points={toPoints(data)} className="fill-primary/25 stroke-primary" strokeWidth={2} />
        {data.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} className="fill-primary" />
        ))}
        {labels.map((label, i) => {
          const [x, y] = point(i, 1.22);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <span className="sr-only">{summary}</span>
    </>
  );
}
