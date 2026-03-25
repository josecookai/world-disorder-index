import { getLatestRecord } from "@/lib/api/data";

export default function AdminPublishPage() {
  const latest = getLatestRecord();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">发布草稿</h1>
      <p className="mt-1 text-sm text-zinc-600">reviewed -&gt; published 工作流预览。</p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">{latest.date}</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          {latest.score_total}/100 - {latest.label_zh}
        </p>
        <p className="mt-2 text-sm text-zinc-600">{latest.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {latest.drivers.map((driver) => (
            <li key={driver}>{driver}</li>
          ))}
        </ul>
        <button className="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm text-white">Publish</button>
      </section>
    </main>
  );
}
