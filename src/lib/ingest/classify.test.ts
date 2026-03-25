import { describe, expect, it } from "vitest";

import {
  buildCandidateEvent,
  compareCandidatePrecedence,
  classifyDimensionFromText,
  getDefaultConfidence,
  getEvidenceTypeForSource,
  getMinConfidenceForEvidenceType,
} from "@/lib/ingest/classify";
import { DEFAULT_CONFIDENCE_BY_KIND, SOURCE_CONFIGS } from "@/lib/ingest/sources";

describe("classify helpers", () => {
  it("classifies text from keywords", () => {
    const dimension = classifyDimensionFromText(
      "Officials announced a tariff and export ban after a growing trade dispute."
    );

    expect(dimension).toBe("trade_sanctions");
  });

  it("limits classification to preferred dimensions", () => {
    const dimension = classifyDimensionFromText(
      "A missile attack followed new sanctions and an export ban.",
      ["energy_shipping", "military_conflict"]
    );

    expect(dimension).toBe("military_conflict");
  });

  it("returns the default confidence for known and unknown sources", () => {
    expect(getDefaultConfidence("ofac_sdn")).toBe(0.9);
    expect(getDefaultConfidence("unknown-source")).toBe(0.6);
  });

  it("derives default confidence from each registered source kind", () => {
    for (const source of SOURCE_CONFIGS) {
      expect(getDefaultConfidence(source.key)).toBe(DEFAULT_CONFIDENCE_BY_KIND[source.kind]);
    }
  });

  it("builds a candidate event with default confidence and evidence type", () => {
    const event = buildCandidateEvent("iaea_news", {
      title: "IAEA issues safeguards update",
      source: "IAEA",
      sourceUrl: "https://example.com/iaea",
      occurredAt: "2026-03-25T00:00:00Z",
      impactDimension: "nuclear_miscalculation",
    });

    expect(event.confidence).toBe(0.8);
    expect(event.evidenceType).toBe("official");
  });

  it("preserves explicit confidence when provided", () => {
    const event = buildCandidateEvent("gnews_api", {
      title: "Shipping disruption expands",
      source: "GNews",
      sourceUrl: "https://example.com/gnews",
      occurredAt: "2026-03-25T00:00:00Z",
      impactDimension: "energy_shipping",
      confidence: 0.91,
    });

    expect(event.confidence).toBe(0.91);
    expect(getEvidenceTypeForSource("gnews_api")).toBe("media");
  });

  it("exposes evidence-type-specific thresholds", () => {
    expect(getMinConfidenceForEvidenceType("structured")).toBe(0.7);
    expect(getMinConfidenceForEvidenceType("official")).toBe(0.78);
    expect(getMinConfidenceForEvidenceType("media")).toBe(0.85);
  });

  it("prefers structured and official sources over media in precedence", () => {
    const structured = buildCandidateEvent("acled", {
      title: "Escalation near border",
      source: "ACLED",
      sourceUrl: "https://example.com/acled",
      occurredAt: "2026-03-25T00:00:00Z",
      impactDimension: "military_conflict",
    });
    const official = buildCandidateEvent("iaea_news", {
      title: "Escalation near border",
      source: "IAEA",
      sourceUrl: "https://example.com/iaea",
      occurredAt: "2026-03-25T00:00:00Z",
      impactDimension: "military_conflict",
    });
    const media = buildCandidateEvent("gnews_api", {
      title: "Escalation near border",
      source: "GNews",
      sourceUrl: "https://example.com/gnews",
      occurredAt: "2026-03-25T00:00:00Z",
      impactDimension: "military_conflict",
    });

    expect(compareCandidatePrecedence(structured, official)).toBeLessThan(0);
    expect(compareCandidatePrecedence(official, media)).toBeLessThan(0);
  });
});
