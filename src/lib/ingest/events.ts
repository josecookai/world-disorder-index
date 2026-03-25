import type { GdiDimensionKey } from "@/lib/types";

export type CandidateEvidenceType = "structured" | "official" | "media";

export type CandidateEvent = {
  title: string;
  sourceKey: string;
  source: string;
  sourceUrl: string;
  occurredAt: string;
  impactDimension: GdiDimensionKey;
  confidence: number;
  evidenceType: CandidateEvidenceType;
  rawCategory?: string;
  rawRegion?: string;
};
