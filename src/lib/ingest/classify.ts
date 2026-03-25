import type { CandidateEvidenceType, CandidateEvent } from "@/lib/ingest/events";
import { DIMENSION_KEYWORDS } from "@/lib/ingest/keywords";
import {
  getSourceByKey,
  DEFAULT_CONFIDENCE_BY_KIND,
  type SourceKind,
  type SourcePriority,
} from "@/lib/ingest/sources";
import type { GdiDimensionKey } from "@/lib/types";

const EVIDENCE_BY_KIND: Record<SourceKind, CandidateEvidenceType> = {
  official_dataset: "structured",
  event_api: "structured",
  official_feed: "official",
  github_dataset: "structured",
  publisher_feed: "media",
  news_api: "media",
};

export const EVIDENCE_TYPE_PRECEDENCE: CandidateEvidenceType[] = [
  "structured",
  "official",
  "media",
];

export const SOURCE_PRIORITY_PRECEDENCE: SourcePriority[] = ["P0", "P1", "P2", "P3"];

export const MIN_CONFIDENCE_BY_EVIDENCE_TYPE: Record<CandidateEvidenceType, number> = {
  structured: 0.7,
  official: 0.78,
  media: 0.85,
};

export function getEvidenceTypeForSource(sourceKey: string): CandidateEvidenceType {
  const source = getSourceByKey(sourceKey);
  return source ? EVIDENCE_BY_KIND[source.kind] : "media";
}

export function getDefaultConfidence(sourceKey: string): number {
  const source = getSourceByKey(sourceKey);
  return source ? DEFAULT_CONFIDENCE_BY_KIND[source.kind] : 0.6;
}

export function getSourcePriorityRank(sourceKey: string): number {
  const source = getSourceByKey(sourceKey);
  if (!source) return SOURCE_PRIORITY_PRECEDENCE.length;

  return SOURCE_PRIORITY_PRECEDENCE.indexOf(source.priority);
}

export function getEvidenceTypeRank(evidenceType: CandidateEvidenceType): number {
  const rank = EVIDENCE_TYPE_PRECEDENCE.indexOf(evidenceType);
  return rank === -1 ? EVIDENCE_TYPE_PRECEDENCE.length : rank;
}

export function getMinConfidenceForEvidenceType(evidenceType: CandidateEvidenceType): number {
  return MIN_CONFIDENCE_BY_EVIDENCE_TYPE[evidenceType];
}

export function compareCandidatePrecedence(left: CandidateEvent, right: CandidateEvent): number {
  const evidenceRankDiff =
    getEvidenceTypeRank(left.evidenceType) - getEvidenceTypeRank(right.evidenceType);
  if (evidenceRankDiff !== 0) return evidenceRankDiff;

  const sourcePriorityDiff = getSourcePriorityRank(left.sourceKey) - getSourcePriorityRank(right.sourceKey);
  if (sourcePriorityDiff !== 0) return sourcePriorityDiff;

  const confidenceDiff = right.confidence - left.confidence;
  if (confidenceDiff !== 0) return confidenceDiff;

  return right.occurredAt.localeCompare(left.occurredAt);
}

export function classifyDimensionFromText(
  text: string,
  preferred: GdiDimensionKey[] = []
): GdiDimensionKey | undefined {
  const haystack = text.toLowerCase();
  const dimensions = preferred.length
    ? preferred
    : (Object.keys(DIMENSION_KEYWORDS) as GdiDimensionKey[]);

  let bestMatch: { dimension: GdiDimensionKey; score: number } | undefined;

  for (const dimension of dimensions) {
    const score = DIMENSION_KEYWORDS[dimension].reduce(
      (count, keyword) => count + (haystack.includes(keyword.toLowerCase()) ? 1 : 0),
      0
    );

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { dimension, score };
    }
  }

  return bestMatch?.dimension;
}

export function buildCandidateEvent(
  sourceKey: string,
  input: Omit<CandidateEvent, "sourceKey" | "confidence" | "evidenceType"> & {
    confidence?: number;
  }
): CandidateEvent {
  return {
    ...input,
    sourceKey,
    confidence: input.confidence ?? getDefaultConfidence(sourceKey),
    evidenceType: getEvidenceTypeForSource(sourceKey),
  };
}
