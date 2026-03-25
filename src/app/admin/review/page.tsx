import { revalidatePath } from "next/cache";
import { clearReviewDecision, listReviewCandidates, setReviewDecision } from "@/lib/review-workflow";
import { IngestPreviewPanel } from "@/app/admin/review/IngestPreviewPanel";

export const dynamic = "force-dynamic";

async function acceptCandidate(formData: FormData) {
  "use server";

  const candidateId = formData.get("candidateId");
  if (typeof candidateId !== "string" || candidateId.length === 0) return;

  await setReviewDecision(candidateId, "accepted");
  revalidatePath("/admin/review");
  revalidatePath("/admin/publish");
}

async function rejectCandidate(formData: FormData) {
  "use server";

  const candidateId = formData.get("candidateId");
  if (typeof candidateId !== "string" || candidateId.length === 0) return;

  await setReviewDecision(candidateId, "rejected");
  revalidatePath("/admin/review");
  revalidatePath("/admin/publish");
}

async function resetCandidate(formData: FormData) {
  "use server";

  const candidateId = formData.get("candidateId");
  if (typeof candidateId !== "string" || candidateId.length === 0) return;

  await clearReviewDecision(candidateId);
  revalidatePath("/admin/review");
  revalidatePath("/admin/publish");
}

function getDecisionClasses(decision: "pending" | "accepted" | "rejected") {
  if (decision === "accepted") return "border-emerald-300 bg-emerald-50";
  if (decision === "rejected") return "border-rose-300 bg-rose-50";
  return "border-zinc-200 bg-white";
}

export default async function AdminReviewPage() {
  const candidates = await listReviewCandidates();
  const pendingCount = candidates.filter((item) => item.decision === "pending").length;
  const acceptedCount = candidates.filter((item) => item.decision === "accepted").length;
  const rejectedCount = candidates.filter((item) => item.decision === "rejected").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">审核候选事件</h1>
      <p className="mt-1 text-sm text-zinc-600">
        候选事件来自 ingest adapters。当前页面会保留 accept/reject 决策，并把 accepted 项汇总到发布草稿。
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        同页底部提供内部 ingest preview，只用于 admin 预览原始候选数据，不会改变审核或发布行为。
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-600">
        <span className="rounded-full bg-zinc-100 px-3 py-1">Pending {pendingCount}</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
          Accepted {acceptedCount}
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">
          Rejected {rejectedCount}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {candidates.map((item) => (
          <section
            key={item.id}
            className={`rounded-xl border p-4 transition-colors ${getDecisionClasses(item.decision)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.source} | 维度: {item.impactDimension} | 置信度: {item.confidence.toFixed(2)} |
                  时间: {item.occurredAt}
                </p>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-zinc-700 underline underline-offset-2"
                >
                  打开来源
                </a>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs uppercase tracking-wide text-zinc-500">{item.decision}</span>
                <div className="flex gap-2">
                  <form action={rejectCandidate}>
                    <input type="hidden" name="candidateId" value={item.id} />
                    <button className="rounded border border-zinc-300 px-3 py-1 text-xs">Reject</button>
                  </form>
                  <form action={acceptCandidate}>
                    <input type="hidden" name="candidateId" value={item.id} />
                    <button className="rounded bg-zinc-900 px-3 py-1 text-xs text-white">Accept</button>
                  </form>
                  {item.decision !== "pending" ? (
                    <form action={resetCandidate}>
                      <input type="hidden" name="candidateId" value={item.id} />
                      <button className="rounded border border-zinc-300 px-3 py-1 text-xs">
                        Reset
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ))}
        {candidates.length === 0 ? (
          <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
            当前没有达到 ingest 阈值的候选事件。
          </section>
        ) : null}
      </div>

      <IngestPreviewPanel />
    </main>
  );
}
