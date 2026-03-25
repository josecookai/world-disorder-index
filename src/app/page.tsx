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
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-gdi-outline/20 bg-gdi-surface-low p-4 lg:flex">
        <div className="mb-8 px-2">
          <div className="font-headline text-lg font-bold text-gdi-primary">Risk Intelligence</div>
          <div className="text-[10px] tracking-wide text-gdi-secondary">Macro-Level Analysis</div>
        </div>
        <nav className="space-y-1 text-xs uppercase tracking-widest">
          <a className="flex items-center gap-3 border-r-4 border-gdi-primary bg-gdi-surface px-3 py-3 font-bold text-gdi-primary" href="#">
            Global Overview
          </a>
          <a className="flex items-center gap-3 px-3 py-3 text-gdi-secondary hover:bg-gdi-surface" href="#">
            Military Risk
          </a>
          <a className="flex items-center gap-3 px-3 py-3 text-gdi-secondary hover:bg-gdi-surface" href="#">
            Geopolitical
          </a>
          <a className="flex items-center gap-3 px-3 py-3 text-gdi-secondary hover:bg-gdi-surface" href="#">
            Trade and Energy
          </a>
          <a className="flex items-center gap-3 px-3 py-3 text-gdi-secondary hover:bg-gdi-surface" href="#">
            Nuclear Watch
          </a>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-50 mx-auto flex w-full max-w-screen-2xl items-center justify-between border-b border-gdi-outline/20 bg-gdi-bg/80 px-6 py-3 backdrop-blur-md">
          <div className="font-headline text-xl font-black uppercase tracking-tighter">
            Global Disorder Index
          </div>
          <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a className="border-b-2 border-gdi-primary pb-1 text-gdi-primary" href="#">
              Intelligence
            </a>
            <a className="text-gdi-secondary hover:text-gdi-primary" href="#">
              Sub-Indices
            </a>
            <a className="text-gdi-secondary hover:text-gdi-primary" href="#">
              Trend Analysis
            </a>
            <a className="text-gdi-secondary hover:text-gdi-primary" href="#">
              Methodology
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-12 p-6 lg:p-12">
          <section className="rounded-xl border border-gdi-outline/10 bg-gdi-surface py-12 text-center shadow-sm">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gdi-secondary">
              Current System State
            </div>
            <div className="flex justify-center">
              <GaugeSemiCircle score={latest.score_total} />
            </div>
            <h1 className="font-headline text-3xl font-bold text-gdi-on-surface">
              {latest.label_en} / {latest.label_zh}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gdi-secondary">
              {latest.summary}
            </p>
            <div className="mt-8 flex items-center justify-center divide-x divide-gdi-outline/30">
              <div className="px-6 text-left">
                <span className="text-[10px] font-bold uppercase text-gdi-outline">Last Update</span>
                <p className="text-xs">{latest.date}</p>
              </div>
              <div className="px-6 text-left">
                <span className="text-[10px] font-bold uppercase text-gdi-outline">Weekly Change</span>
                <p className="text-xs font-bold text-gdi-danger">
                  {latest.wow_change >= 0 ? "+" : ""}
                  {latest.wow_change}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <DriversPanel drivers={latest.drivers} summary={latest.summary} />
              <RiskBand currentLabelZh={latest.label_zh} />
            </div>
            <div className="lg:col-span-7">
              <DimensionBars record={latest} />
            </div>
          </div>

          <TrendChart records={history} />

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {["Orbital Intelligence", "Global Logistics Flow", "Financial Contagion"].map((title) => (
              <div key={title} className="relative h-48 overflow-hidden rounded-xl bg-gdi-surface-low">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-widest text-white">
                  {title}
                </div>
              </div>
            ))}
          </section>

          <footer className="flex flex-col items-center justify-between gap-4 border-t border-gdi-outline/20 py-8 text-[10px] md:flex-row">
            <div className="text-gdi-secondary">
              © 2026 Editorial Intelligence. Data provided by Sovereign Analyst Group.
            </div>
            <div className="max-w-sm text-right text-gdi-secondary/70">
              Methodology: structured judgment model across military escalation, trade flow volatility,
              and strategic posture changes.
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
