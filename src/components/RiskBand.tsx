const RANGES = [
  "0-20 和平红利",
  "21-40 脆弱稳定",
  "41-60 局部战争常态化",
  "61-80 全球失序",
  "81-99 系统性战争风险",
  "100 第三次世界大战",
];

type Props = {
  currentLabelZh: string;
};

export function RiskBand({ currentLabelZh }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-zinc-900">风险区间说明</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {RANGES.map((range) => {
          const active = range.includes(currentLabelZh);
          return (
            <span
              key={range}
              className={`rounded-full border px-3 py-1 text-xs ${
                active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-600"
              }`}
            >
              {range}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        当前处于“{currentLabelZh}”区间：世界未失控，但主要摩擦与尾部风险正在上升。
      </p>
    </section>
  );
}
