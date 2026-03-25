type Props = {
  currentLabelZh: string;
};

export function RiskBand({ currentLabelZh }: Props) {
  return (
    <section className="rounded-xl border border-gdi-outline/20 bg-gdi-surface p-6">
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-gdi-outline">
        Risk Spectrum Legend
      </h3>
      <div className="relative pt-6 pb-2">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gdi-surface-low">
          <div className="h-full w-[20%] bg-[#a8e6cf]" />
          <div className="h-full w-[20%] bg-[#9a9d9f]" />
          <div className="h-full w-[20%] bg-[#ffd3b6]" />
          <div className="h-full w-[20%] bg-[#ff8b94]" />
          <div className="h-full w-[19%] bg-[#ba1e1e]" />
          <div className="h-full w-[1%] bg-[#4e0309]" />
        </div>
        <div className="mt-4 flex justify-between text-[9px] font-bold uppercase tracking-tighter text-gdi-outline">
          <span>Peace</span>
          <span className="text-gdi-on-surface">Fragile</span>
          <span>Conflict</span>
          <span>Disorder</span>
          <span>War</span>
          <span>WWIII</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-gdi-secondary">
        当前区间：{currentLabelZh}。用户应将该值理解为失序程度仪表盘，而非概率预测器。
      </p>
    </section>
  );
}
