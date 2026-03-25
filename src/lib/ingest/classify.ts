import type { CandidateEvidenceType, CandidateEvent } from "@/lib/ingest/events";
import { DIMENSION_KEYWORDS } from "@/lib/ingest/keywords";
import {
  DEFAULT_CONFIDENCE_BY_KIND,
  getSourceByKey,
  type SourceKind,
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

export function getEvidenceTypeForSource(sourceKey: string): CandidateEvidenceType {
  const source = getSourceByKey(sourceKey);
  return source ? EVIDENCE_BY_KIND[source.kind] : "media";
}

export function getDefaultConfidence(sourceKey: string): number {
  const source = getSourceByKey(sourceKey);
  return source ? DEFAULT_CONFIDENCE_BY_KIND[source.kind] : 0.6;
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
