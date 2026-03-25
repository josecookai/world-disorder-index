const mockCandidates = [
  {
    id: "evt-1",
    title: "红海航运保险成本上升",
    source: "Reuters",
    impactDimension: "energy_shipping",
    confidence: 0.81,
  },
  {
    id: "evt-2",
    title: "新一轮关税讨论升温",
    source: "AP",
    impactDimension: "trade_sanctions",
    confidence: 0.72,
  },
];

export default function AdminReviewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">审核候选事件</h1>
      <p className="mt-1 text-sm text-zinc-600">
        MVP 阶段为静态示例。后续接 Supabase 后可实现 accept/reject/edit 持久化。
      </p>

      <div className="mt-6 space-y-3">
        {mockCandidates.map((item) => (
          <section key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.source} | 维度: {item.impactDimension} | 置信度: {item.confidence}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border border-zinc-300 px-3 py-1 text-xs">Reject</button>
                <button className="rounded bg-zinc-900 px-3 py-1 text-xs text-white">Accept</button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
