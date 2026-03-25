import { getLatestRecord } from "@/lib/api/data";
import { publishLatestRecord } from "@/lib/publish-workflow";
import { getReviewedDraft } from "@/lib/review-workflow";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function publishAction() {
  "use server";

  const result = await publishLatestRecord();
  if (!result.ok) {
    throw new Error(result.message);
  }

  revalidatePath("/admin/publish");
  redirect("/admin/publish");
}

export default async function AdminPublishPage() {
  const [latest, draft] = await Promise.all([getLatestRecord(), getReviewedDraft()]);
  const record = draft ?? latest;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">发布草稿</h1>
      <p className="mt-1 text-sm text-zinc-600">
        reviewed -&gt; published 工作流预览。若存在 accepted candidates，这里优先展示 reviewed draft。
      </p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">{record.date}</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          {record.score_total}/100 - {record.label_zh}
        </p>
        <p className="mt-2 text-sm text-zinc-600">{record.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {record.drivers.map((driver) => (
            <li key={driver}>{driver}</li>
          ))}
        </ul>
        {draft ? (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
            基于 {draft.acceptedCount} 条 accepted candidates 生成，最近审核时间 {draft.reviewedAt ?? "unknown"}。
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700">
            当前没有 reviewed draft，发布按钮将沿用最新记录。
          </div>
        )}
        <form action={publishAction}>
          <button className="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm text-white">Publish</button>
        </form>
      </section>
    </main>
  );
}
