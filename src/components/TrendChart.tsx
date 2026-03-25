import type { GdiRecord } from "@/lib/types";

type Props = {
  records: GdiRecord[];
};

export function TrendChart({ records }: Props) {
  const width = 700;
  const height = 220;
  const padding = 24;
  const max = 100;
  const min = 0;

  const points = records.map((row, index) => {
    const x = padding + (index / Math.max(records.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((row.score_total - min) / (max - min)) * (height - padding * 2);
    return { x, y, date: row.date, value: row.score_total };
  });

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">历史趋势</h2>
        <span className="text-xs text-zinc-500">0 - 100</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-56 w-full">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d4d4d8" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d4d4d8" />
        <path d={d} fill="none" stroke="#27272a" strokeWidth="3" />
        {points.map((p) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="4" fill="#18181b" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-zinc-600 text-[10px]">
              {p.value}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
