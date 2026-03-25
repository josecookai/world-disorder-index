import { getLatestRecord } from "@/lib/api/data";
import { runIngestPreview } from "@/lib/ingest";
import {
  listPersistedCandidates,
  persistCandidates,
  updatePersistedCandidateStatus,
  type PersistedCandidate,
} from "@/lib/ingest/persistence";
import { enrichRecord } from "@/lib/scoring/engine";
import type { GdiDimensionKey, GdiRecord } from "@/lib/types";

export type ReviewDecision = "pending" | "accepted" | "rejected";

export type ReviewCandidate = PersistedCandidate & {
  decision: ReviewDecision;
};

type ReviewedDraft = GdiRecord & {
  acceptedCount: number;
  reviewedAt: string | null;
};

const DIMENSION_WEIGHTS: Record<GdiDimensionKey, number> = {
  military_conflict: 2.4,
  great_power_tension: 1.8,
  trade_sanctions: 1.6,
  energy_shipping: 1.5,
  nuclear_miscalculation: 1.9,
};

const DECISION_SORT_ORDER: Record<ReviewDecision, number> = {
  pending: 0,
  accepted: 1,
  rejected: 1,
};

function clampDimensionScore(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function buildDrivers(accepted: ReviewCandidate[]): string[] {
  return accepted
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)
    .map((item) => item.title);
}

function buildSummary(accepted: ReviewCandidate[]): string {
  if (accepted.length === 0) {
    return "本期尚无已审核通过的新增候选事件，维持上一期判断。";
  }

  const topTitles = accepted
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2)
    .map((item) => item.title);

  return `已审核通过 ${accepted.length} 条候选事件，当前草稿主要由 ${topTitles.join("、")} 等信号驱动。`;
}

function getLatestReviewedAt(accepted: ReviewCandidate[]): string | null {
  const values = accepted
    .map((item) => item.reviewedAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));

  return values[0] ?? null;
}

export async function listReviewCandidates(): Promise<ReviewCandidate[]> {
  let candidates = await listPersistedCandidates();
  if (candidates.length === 0) {
    const ingestResult = await runIngestPreview();
    candidates = await persistCandidates(ingestResult.candidates);
  }

  return candidates
    .map((candidate) => {
      return {
        ...candidate,
        decision: candidate.status,
      };
    })
    .sort((a, b) => {
      const decisionOrder = DECISION_SORT_ORDER[a.decision] - DECISION_SORT_ORDER[b.decision];
      if (decisionOrder !== 0) return decisionOrder;
      return b.occurredAt.localeCompare(a.occurredAt) || b.confidence - a.confidence;
    });
}

export async function setReviewDecision(
  candidateId: string,
  decision: Exclude<ReviewDecision, "pending">
) {
  await updatePersistedCandidateStatus(candidateId, decision);
}

export async function clearReviewDecision(candidateId: string) {
  await updatePersistedCandidateStatus(candidateId, "pending");
}

export async function getReviewedDraft(): Promise<ReviewedDraft | null> {
  const [latest, candidates] = await Promise.all([getLatestRecord(), listReviewCandidates()]);
  const accepted = candidates.filter((candidate) => candidate.decision === "accepted");

  if (accepted.length === 0) {
    return null;
  }

  const dimensionBoosts = accepted.reduce<Record<GdiDimensionKey, number>>(
    (acc, candidate) => {
      acc[candidate.impactDimension] += candidate.confidence * DIMENSION_WEIGHTS[candidate.impactDimension];
      return acc;
    },
    {
      military_conflict: 0,
      great_power_tension: 0,
      trade_sanctions: 0,
      energy_shipping: 0,
      nuclear_miscalculation: 0,
    }
  );

  const nextBase: Omit<GdiRecord, "score_total" | "label_en" | "label_zh" | "wow_change"> = {
    ...latest,
    military_conflict: clampDimensionScore(latest.military_conflict + dimensionBoosts.military_conflict),
    great_power_tension: clampDimensionScore(
      latest.great_power_tension + dimensionBoosts.great_power_tension
    ),
    trade_sanctions: clampDimensionScore(latest.trade_sanctions + dimensionBoosts.trade_sanctions),
    energy_shipping: clampDimensionScore(latest.energy_shipping + dimensionBoosts.energy_shipping),
    nuclear_miscalculation: clampDimensionScore(
      latest.nuclear_miscalculation + dimensionBoosts.nuclear_miscalculation
    ),
    drivers: buildDrivers(accepted),
    summary: buildSummary(accepted),
    status: "reviewed",
    reviewed_by: "admin_review_workflow",
    published_at: undefined,
  };

  const draft = enrichRecord(nextBase, latest);

  return {
    ...draft,
    acceptedCount: accepted.length,
    reviewedAt: getLatestReviewedAt(accepted),
  };
}
