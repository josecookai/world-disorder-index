import { describe, expect, it } from "vitest";

import type { CandidateEvent } from "@/lib/ingest/events";
import { dedupeCandidates, filterByConfidence } from "@/lib/ingest/normalize";

function makeCandidate(overrides: Partial<CandidateEvent>): CandidateEvent {
  return {
    title: "Base event",
    sourceKey: "gdelt_events",
    source: "GDELT",
    sourceUrl: "https://example.com/base",
    occurredAt: "2026-03-25T00:00:00Z",
    impactDimension: "military_conflict",
    confidence: 0.8,
    evidenceType: "structured",
    explainability: {
      dimensionReason: "Matched 1 keyword for military_conflict.",
      ruleFamily: "keyword_match",
      matchedKeywords: ["missile"],
      sourceRationale: "GDELT is a structured discovery source.",
      evidenceRationale: "Structured evidence from event_api source kind.",
    },
    ...overrides,
  };
}

describe("normalize helpers", () => {
  it("dedupes by source url before title-based fallbacks", () => {
    const items = [
      makeCandidate({
        title: "Naval strike near chokepoint",
        sourceKey: "gdelt_events",
        source: "GDELT",
        sourceUrl: " https://example.com/event-1 ",
      }),
      makeCandidate({
        title: "Completely different title",
        sourceKey: "reuters_world",
        source: "Reuters",
        sourceUrl: "https://example.com/event-1",
      }),
    ];

    expect(dedupeCandidates(items)).toEqual([items[0]]);
  });

  it("falls back to normalized title plus source key when url is absent", () => {
    const items = [
      makeCandidate({
        title: " Missile Attack  Reported ",
        sourceKey: "gdelt_events",
        source: "GDELT",
        sourceUrl: "",
      }),
      makeCandidate({
        title: "missile attack reported",
        sourceKey: "gdelt_events",
        source: "Other Source Name",
        sourceUrl: "",
      }),
    ];

    expect(dedupeCandidates(items)).toEqual([items[0]]);
  });

  it("falls back to normalized title plus source name when source key differs", () => {
    const items = [
      makeCandidate({
        title: "Port shutdown expands",
        sourceKey: "newsdata_api",
        source: "Reuters",
        sourceUrl: "",
      }),
      makeCandidate({
        title: "port shutdown expands",
        sourceKey: "gnews_api",
        source: "Reuters",
        sourceUrl: "",
      }),
    ];

    expect(dedupeCandidates(items)).toEqual([items[0]]);
  });

  it("prefers stronger evidence when duplicate media items conflict", () => {
    const items = [
      makeCandidate({
        title: "Port shutdown expands",
        sourceKey: "gnews_api",
        source: "GNews",
        sourceUrl: "https://example.com/media",
        confidence: 0.93,
        evidenceType: "media",
      }),
      makeCandidate({
        title: "Port shutdown expands",
        sourceKey: "ofac_sdn",
        source: "OFAC",
        sourceUrl: "https://example.com/official",
        confidence: 0.9,
        evidenceType: "structured",
      }),
    ];

    expect(dedupeCandidates(items)).toEqual([items[1]]);
  });

  it("filters out items below evidence-type-specific minimum confidence", () => {
    const items = [
      makeCandidate({ title: "Structured keep", confidence: 0.7, evidenceType: "structured" }),
      makeCandidate({
        title: "Official keep",
        confidence: 0.78,
        sourceUrl: "https://example.com/b",
        evidenceType: "official",
      }),
      makeCandidate({
        title: "Media drop",
        confidence: 0.84,
        sourceUrl: "https://example.com/c",
        evidenceType: "media",
      }),
    ];

    expect(filterByConfidence(items)).toEqual(items.slice(0, 2));
    expect(filterByConfidence(items, 0.9)).toEqual([]);
  });
});
