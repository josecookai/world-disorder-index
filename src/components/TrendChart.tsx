import type { GdiRecord } from "@/lib/types";

type Props = {
  records: GdiRecord[];
};

export function TrendChart({ records }: Props) {
  const width = 1000;
  const height = 300;
  const padding = 32;
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
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-headline text-sm font-bold uppercase tracking-widest">
            12-Month Trend Analysis
          </h2>
          <p className="mt-1 text-[10px] font-medium text-gdi-outline">GDI Aggregate Score</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-gdi-surface-low px-3 py-1 text-[10px] font-bold">1Y</button>
          <button className="rounded px-3 py-1 text-[10px] font-bold hover:bg-gdi-surface-low">5Y</button>
          <button className="rounded px-3 py-1 text-[10px] font-bold hover:bg-gdi-surface-low">ALL</button>
        </div>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-xl border border-gdi-outline/20 bg-gdi-surface p-6">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d9e4ea" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d9e4ea" />
          <path d={d} fill="none" stroke="#5f5e5f" strokeWidth="2.5" />
          {points.map((p) => (
            <g key={p.date}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#ba1e1e" />
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
