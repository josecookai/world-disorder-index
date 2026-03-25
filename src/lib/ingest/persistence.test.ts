import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateEvent } from "@/lib/ingest/events";
import {
  getCandidateId,
  listPersistedCandidates,
  persistCandidates,
  updatePersistedCandidateStatus,
} from "@/lib/ingest/persistence";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceRoleClient: vi.fn(() => null),
}));

function makeCandidate(overrides: Partial<CandidateEvent> = {}): CandidateEvent {
  return {
    title: "ACLED conflict event",
    sourceKey: "acled",
    source: "ACLED",
    sourceUrl: "https://example.com/acled/1",
    occurredAt: "2026-03-25T00:00:00.000Z",
    impactDimension: "military_conflict",
    confidence: 0.9,
    evidenceType: "structured",
    rawCategory: "Political violence / Battles",
    rawRegion: "Ukraine / Donetsk",
    ...overrides,
  };
}

describe("ingest persistence", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gdi-ingest-persistence-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists candidates to the local fallback store", async () => {
    const candidates = [makeCandidate()];

    const persisted = await persistCandidates(candidates);
    const stored = await listPersistedCandidates();
    const rawFile = await readFile(path.join(tempDir, "data", "ingest-candidates.json"), "utf8");

    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.id).toBe(getCandidateId(candidates[0]!));
    expect(stored[0]).toMatchObject({
      title: candidates[0]?.title,
      status: "pending",
    });
    expect(JSON.parse(rawFile)).toMatchObject({
      candidates: [
        {
          id: getCandidateId(candidates[0]!),
          sourceKey: "acled",
        },
      ],
    });
  });

  it("preserves persisted status across repeated ingest saves", async () => {
    const candidate = makeCandidate();
    const candidateId = getCandidateId(candidate);

    await persistCandidates([candidate]);
    await updatePersistedCandidateStatus(candidateId, "accepted");
    await persistCandidates([candidate]);

    const stored = await listPersistedCandidates();

    expect(stored[0]).toMatchObject({
      id: candidateId,
      status: "accepted",
    });
    expect(stored[0]?.reviewedAt).toBeTruthy();
  });
});
