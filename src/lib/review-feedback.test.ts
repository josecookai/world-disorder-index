import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PersistedCandidate } from "@/lib/ingest/persistence";
import { refreshReviewFeedback } from "@/lib/review-feedback";

function makeCandidate(overrides: Partial<PersistedCandidate> = {}): PersistedCandidate {
  return {
    id: "candidate-1",
    title: "Missile attack near chokepoint",
    source: "GDELT",
    sourceKey: "gdelt_events",
    sourceUrl: "https://example.com/1",
    occurredAt: "2026-03-25T00:00:00Z",
    impactDimension: "military_conflict",
    confidence: 0.85,
    evidenceType: "structured",
    explainability: {
      dimensionReason: "Matched 2 keyword(s) for military_conflict.",
      ruleFamily: "keyword_match",
      matchedKeywords: ["missile", "attack"],
      sourceRationale: "GDELT is a structured discovery source.",
      evidenceRationale: "Structured evidence from event_api source kind.",
    },
    status: "accepted",
    createdAt: "2026-03-25T00:00:00Z",
    updatedAt: "2026-03-25T00:00:00Z",
    ...overrides,
  };
}

describe("review feedback", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gdi-review-feedback-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("writes aggregated feedback by rule family and rejected keywords", async () => {
    const summary = await refreshReviewFeedback([
      makeCandidate(),
      makeCandidate({
        id: "candidate-2",
        status: "rejected",
      }),
    ]);

    expect(summary.acceptedCount).toBe(1);
    expect(summary.rejectedCount).toBe(1);
    expect(summary.byRuleFamily[0]).toMatchObject({
      key: "keyword_match",
      accepted: 1,
      rejected: 1,
    });
    expect(summary.topRejectedKeywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: "missile", count: 1 }),
        expect.objectContaining({ keyword: "attack", count: 1 }),
      ])
    );

    const raw = await readFile(path.join(tempDir, "data", "ingest-review-feedback.json"), "utf8");
    expect(JSON.parse(raw)).toMatchObject({
      acceptedCount: 1,
      rejectedCount: 1,
    });
  });
});
