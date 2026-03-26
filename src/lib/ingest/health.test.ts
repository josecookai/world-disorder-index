import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  getIngestSourceHealthSummaries,
  recordIngestDiagnostics,
  type IngestSourceDiagnostic,
} from "@/lib/ingest/health";

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
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gdi-ingest-health-"));
    process.chdir(tempDir);
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.unstubAllEnvs();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("records current diagnostics and surfaces unhealthy empty runs", async () => {
    await recordIngestDiagnostics([
      makeDiagnostic({
        sourceKey: "iaea_news",
        candidateCount: 0,
        empty: true,
      }),
    ]);

    const summaries = await getIngestSourceHealthSummaries();

    expect(summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceKey: "iaea_news",
          lastOk: true,
          lastEmpty: true,
          unhealthy: true,
          consecutiveFailures: 0,
        }),
      ])
    );
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

    expect(summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceKey: "acled",
          lastOk: false,
          consecutiveFailures: 2,
          unhealthy: true,
          lastError: "Missing credentials",
        }),
      ])
    );
  });

  it("returns empty health state when local ingest state is disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(recordIngestDiagnostics([makeDiagnostic({ sourceKey: "gdelt_events" })])).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceKey: "gdelt_events",
        }),
      ])
    );
    await expect(getIngestSourceHealthSummaries()).resolves.toEqual([]);
  });
});
