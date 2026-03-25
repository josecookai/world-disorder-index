import type { GdiDimensionKey } from "@/lib/types";

export type CandidateEvidenceType = "structured" | "official" | "media";

export type CandidateExplainability = {
  dimensionReason: string;
  ruleFamily: string;
  matchedKeywords: string[];
  sourceRationale: string;
  evidenceRationale: string;
};

export type CandidateEvent = {
  title: string;
  sourceKey: string;
  source: string;
  sourceUrl: string;
  occurredAt: string;
  impactDimension: GdiDimensionKey;
  confidence: number;
  evidenceType: CandidateEvidenceType;
  explainability: CandidateExplainability;
  rawCategory?: string;
  rawRegion?: string;
};
