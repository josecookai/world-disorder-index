import type {
  CandidateEvidenceType,
  CandidateEvent,
  CandidateExplainability,
} from "@/lib/ingest/events";
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

// Calibrated from live preview behavior:
// - structured sources are allowed a lower floor because they are already normalized datasets/APIs
// - official feeds are high-signal but still text-derived, so they keep a slightly higher floor
// - media remains the strictest tier because keyword-only news matching is the noisiest path
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

export type DimensionClassification = {
  dimension: GdiDimensionKey;
  matchedKeywords: string[];
  ruleFamily: string;
  dimensionReason: string;
};

export function classifyDimensionFromTextDetailed(
  text: string,
  preferred: GdiDimensionKey[] = []
): DimensionClassification | undefined {
  const haystack = text.toLowerCase();
  const dimensions = preferred.length
    ? preferred
    : (Object.keys(DIMENSION_KEYWORDS) as GdiDimensionKey[]);

  let bestMatch: (DimensionClassification & { score: number }) | undefined;

  for (const dimension of dimensions) {
    const matchedKeywords = DIMENSION_KEYWORDS[dimension].filter((keyword) =>
      haystack.includes(keyword.toLowerCase())
    );

    if (
      matchedKeywords.length > 0 &&
      (!bestMatch || matchedKeywords.length > bestMatch.score)
    ) {
      bestMatch = {
        dimension,
        matchedKeywords,
        ruleFamily: "keyword_match",
        dimensionReason: `Matched ${matchedKeywords.length} keyword(s) for ${dimension}.`,
        score: matchedKeywords.length,
      };
    }
  }

  if (!bestMatch) return undefined;

  const { score, ...result } = bestMatch;
  void score;
  return result;
}

export function classifyDimensionFromText(
  text: string,
  preferred: GdiDimensionKey[] = []
): GdiDimensionKey | undefined {
  return classifyDimensionFromTextDetailed(text, preferred)?.dimension;
}

function buildSourceRationale(sourceKey: string): string {
  const source = getSourceByKey(sourceKey);
  if (!source) {
    return "Source registry entry missing; treated as fallback media input.";
  }

  return `${source.name} is a ${source.kind} source with ${source.priority} priority. ${source.implementationNotes}`;
}

function buildEvidenceRationale(sourceKey: string, evidenceType: CandidateEvidenceType): string {
  const source = getSourceByKey(sourceKey);
  if (!source) {
    return `Evidence type ${evidenceType} inferred from unknown source metadata.`;
  }

  return `Evidence type ${evidenceType} comes from source kind ${source.kind} with default confidence ${DEFAULT_CONFIDENCE_BY_KIND[source.kind].toFixed(2)}.`;
}

function buildExplainability(
  sourceKey: string,
  input: {
    impactDimension: GdiDimensionKey;
    rawCategory?: string;
    explainability?: Partial<CandidateExplainability>;
  }
): CandidateExplainability {
  const evidenceType = getEvidenceTypeForSource(sourceKey);

  return {
    dimensionReason:
      input.explainability?.dimensionReason ??
      (input.rawCategory
        ? `Mapped to ${input.impactDimension} from adapter rule using raw category "${input.rawCategory}".`
        : `Mapped to ${input.impactDimension} by adapter-defined rule.`),
    ruleFamily: input.explainability?.ruleFamily ?? "adapter_mapping",
    matchedKeywords: input.explainability?.matchedKeywords ?? [],
    sourceRationale: input.explainability?.sourceRationale ?? buildSourceRationale(sourceKey),
    evidenceRationale:
      input.explainability?.evidenceRationale ?? buildEvidenceRationale(sourceKey, evidenceType),
  };
}

export function buildCandidateEvent(
  sourceKey: string,
  input: Omit<CandidateEvent, "sourceKey" | "confidence" | "evidenceType" | "explainability"> & {
    confidence?: number;
    explainability?: Partial<CandidateExplainability>;
  }
): CandidateEvent {
  return {
    ...input,
    sourceKey,
    confidence: input.confidence ?? getDefaultConfidence(sourceKey),
    evidenceType: getEvidenceTypeForSource(sourceKey),
    explainability: buildExplainability(sourceKey, input),
  };
}
