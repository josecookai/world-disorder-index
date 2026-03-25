import { DimensionBars } from "@/components/DimensionBars";
import { DriversPanel } from "@/components/DriversPanel";
import { GaugeSemiCircle } from "@/components/GaugeSemiCircle";
import { RiskBand } from "@/components/RiskBand";
import { TrendChart } from "@/components/TrendChart";
import { getHistoryByRange, getLatestRecord } from "@/lib/api/data";

export default function Home() {
  const latest = getLatestRecord();
  const history = getHistoryByRange("3M");

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Global Disorder Index</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">世界完蛋了指数</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {latest.score_total}/100 - {latest.label_zh} ({latest.label_en})
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Updated: {latest.date} | WoW: {latest.wow_change >= 0 ? "+" : ""}
              {latest.wow_change}
            </p>
          </div>
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white">
            {latest.label_zh}
          </span>
        </div>
        <div className="mt-4">
          <GaugeSemiCircle score={latest.score_total} />
        </div>
        <p className="mt-2 text-sm text-zinc-600">{latest.summary}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DimensionBars record={latest} />
        <DriversPanel drivers={latest.drivers} summary={latest.summary} />
      </div>

      <TrendChart records={history} />
      <RiskBand currentLabelZh={latest.label_zh} />

      <section className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
        本指数不是概率预测器，而是全球失序程度仪表盘，用于帮助用户快速理解风险状态及其变化。
      </section>
    </main>
  );
}
