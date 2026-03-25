import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import {
  getIngestSourceHealthSummaries,
  recordIngestDiagnostics,
  type IngestSourceDiagnostic,
} from "@/lib/ingest/health";

const HEALTH_PATH = path.join(process.cwd(), "data", "ingest-health.json");

async function cleanup() {
  await rm(HEALTH_PATH, { force: true });
}

afterEach(async () => {
  await cleanup();
});

function makeDiagnostic(overrides: Partial<IngestSourceDiagnostic>): IngestSourceDiagnostic {
  return {
    sourceKey: "gdelt_events",
    ok: true,
    candidateCount: 3,
    durationMs: 200,
    empty: false,
    ...overrides,
  };
}

describe("ingest health", () => {
  it("records current diagnostics and surfaces unhealthy empty runs", async () => {
    await recordIngestDiagnostics([
      makeDiagnostic({
        sourceKey: "iaea_news",
        candidateCount: 0,
        empty: true,
      }),
    ]);

    const summaries = await getIngestSourceHealthSummaries();

    expect(summaries).toEqual([
      expect.objectContaining({
        sourceKey: "iaea_news",
        lastOk: true,
        lastEmpty: true,
        unhealthy: true,
        consecutiveFailures: 0,
      }),
    ]);
  });

  it("tracks consecutive failures across runs", async () => {
    await recordIngestDiagnostics([
      makeDiagnostic({
        sourceKey: "acled",
        ok: false,
        candidateCount: 0,
        empty: true,
        error: "Missing credentials",
      }),
    ]);

    await recordIngestDiagnostics([
      makeDiagnostic({
        sourceKey: "acled",
        ok: false,
        candidateCount: 0,
        empty: true,
        error: "Missing credentials",
      }),
    ]);

    const summaries = await getIngestSourceHealthSummaries();

    expect(summaries).toEqual([
      expect.objectContaining({
        sourceKey: "acled",
        lastOk: false,
        consecutiveFailures: 2,
        unhealthy: true,
        lastError: "Missing credentials",
      }),
    ]);
  });
});
