import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PersistedCandidate } from "@/lib/ingest/persistence";

type ReviewedCandidate = PersistedCandidate & {
  status: "accepted" | "rejected";
};

export type ReviewFeedbackSummary = {
  reviewedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  byDimension: Array<{ key: string; accepted: number; rejected: number }>;
  byEvidenceType: Array<{ key: string; accepted: number; rejected: number }>;
  bySource: Array<{ key: string; accepted: number; rejected: number }>;
  byRuleFamily: Array<{ key: string; accepted: number; rejected: number }>;
  topRejectedKeywords: Array<{ keyword: string; count: number }>;
  updatedAt: string | null;
};

function getReviewFeedbackPath(): string {
  return path.join(process.cwd(), "data", "ingest-review-feedback.json");
}

function emptySummary(): ReviewFeedbackSummary {
  return {
    reviewedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    byDimension: [],
    byEvidenceType: [],
    bySource: [],
    byRuleFamily: [],
    topRejectedKeywords: [],
    updatedAt: null,
  };
}

function incrementCounter(
  map: Map<string, { accepted: number; rejected: number }>,
  key: string,
  decision: "accepted" | "rejected"
) {
  const current = map.get(key) ?? { accepted: 0, rejected: 0 };
  current[decision] += 1;
  map.set(key, current);
}

function toSortedEntries(map: Map<string, { accepted: number; rejected: number }>) {
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((left, right) => {
      const leftTotal = left.accepted + left.rejected;
      const rightTotal = right.accepted + right.rejected;
      return rightTotal - leftTotal || left.key.localeCompare(right.key);
    });
}

async function ensureDir() {
  await mkdir(path.dirname(getReviewFeedbackPath()), { recursive: true });
}

export async function refreshReviewFeedback(candidates: PersistedCandidate[]): Promise<ReviewFeedbackSummary> {
  const reviewed = candidates.filter(
    (candidate): candidate is ReviewedCandidate =>
      candidate.status === "accepted" || candidate.status === "rejected"
  );

  const byDimension = new Map<string, { accepted: number; rejected: number }>();
  const byEvidenceType = new Map<string, { accepted: number; rejected: number }>();
  const bySource = new Map<string, { accepted: number; rejected: number }>();
  const byRuleFamily = new Map<string, { accepted: number; rejected: number }>();
  const rejectedKeywordCounts = new Map<string, number>();

  for (const candidate of reviewed) {
    const decision = candidate.status;
    incrementCounter(byDimension, candidate.impactDimension, decision);
    incrementCounter(byEvidenceType, candidate.evidenceType, decision);
    incrementCounter(bySource, candidate.sourceKey, decision);
    incrementCounter(byRuleFamily, candidate.explainability.ruleFamily, decision);

    if (decision === "rejected") {
      for (const keyword of candidate.explainability.matchedKeywords) {
        rejectedKeywordCounts.set(keyword, (rejectedKeywordCounts.get(keyword) ?? 0) + 1);
      }
    }
  }

  const summary: ReviewFeedbackSummary = {
    reviewedCount: reviewed.length,
    acceptedCount: reviewed.filter((candidate) => candidate.status === "accepted").length,
    rejectedCount: reviewed.filter((candidate) => candidate.status === "rejected").length,
    byDimension: toSortedEntries(byDimension),
    byEvidenceType: toSortedEntries(byEvidenceType),
    bySource: toSortedEntries(bySource),
    byRuleFamily: toSortedEntries(byRuleFamily),
    topRejectedKeywords: Array.from(rejectedKeywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((left, right) => right.count - left.count || left.keyword.localeCompare(right.keyword))
      .slice(0, 5),
    updatedAt: new Date().toISOString(),
  };

  await ensureDir();
  await writeFile(getReviewFeedbackPath(), JSON.stringify(summary, null, 2), "utf8");

  return summary;
}

export async function readReviewFeedback(): Promise<ReviewFeedbackSummary> {
  try {
    const raw = await readFile(getReviewFeedbackPath(), "utf8");
    return JSON.parse(raw) as ReviewFeedbackSummary;
  } catch {
    return emptySummary();
  }
}
