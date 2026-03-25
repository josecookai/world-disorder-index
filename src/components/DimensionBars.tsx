import { DIMENSION_META } from "@/lib/types";
import type { GdiRecord } from "@/lib/types";

type Props = {
  record: GdiRecord;
};

export function DimensionBars({ record }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-headline text-sm font-bold uppercase tracking-widest">Sub-Indices Breakdown</h2>
        <span className="text-[10px] font-semibold uppercase text-gdi-outline">Max 20 Per Dimension</span>
      </div>
      <div className="mt-4 space-y-4">
        {DIMENSION_META.map((dimension) => {
          const value = record[dimension.key] as number;
          const percent = (value / 20) * 100;
          return (
            <div
              key={dimension.key}
              className="rounded-xl border border-gdi-outline/20 bg-gdi-surface p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-gdi-on-surface">{dimension.nameEn}</span>
                <span className="font-headline font-black tracking-tight text-gdi-on-surface">
                  {String(value).padStart(2, "0")} <span className="text-[10px] font-normal text-gdi-outline">/20</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gdi-surface-low">
                <div className="h-1.5 rounded-full bg-gdi-danger" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-gdi-secondary">{dimension.shortReason}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
