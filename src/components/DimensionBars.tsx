import { DIMENSION_META } from "@/lib/types";
import type { GdiRecord } from "@/lib/types";

type Props = {
  record: GdiRecord;
};

export function DimensionBars({ record }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-zinc-900">五维分项拆解</h2>
      <div className="mt-4 space-y-4">
        {DIMENSION_META.map((dimension) => {
          const value = record[dimension.key] as number;
          const percent = (value / 20) * 100;
          return (
            <div key={dimension.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-800">{dimension.nameZh}</span>
                <span className="text-zinc-600">
                  {value}/20
                </span>
              </div>
              <div className="h-2 w-full rounded bg-zinc-200">
                <div className="h-2 rounded bg-zinc-800" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1 text-xs text-zinc-500">{dimension.shortReason}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
