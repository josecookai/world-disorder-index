import { beforeEach, describe, expect, it, vi } from "vitest";

const runIngestPreviewMock = vi.fn();
const mkdirMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock("node:fs/promises", () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

vi.mock("@/lib/ingest", () => ({
  runIngestPreview: runIngestPreviewMock,
}));

describe("scheduled ingest", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.INGEST_SCHEDULE_SECRET;
  });

  it("prefers CRON_SECRET and falls back to INGEST_SCHEDULE_SECRET", async () => {
    process.env.CRON_SECRET = "cron-secret";
    process.env.INGEST_SCHEDULE_SECRET = "fallback-secret";

    const { isValidIngestScheduleSecret } = await import("@/lib/ingest/scheduled");

    expect(isValidIngestScheduleSecret("cron-secret")).toBe(true);
    expect(isValidIngestScheduleSecret("fallback-secret")).toBe(false);

    delete process.env.CRON_SECRET;

    expect(isValidIngestScheduleSecret("fallback-secret")).toBe(true);
    expect(isValidIngestScheduleSecret("wrong-secret")).toBe(false);
  });

  it("returns a run summary even when local summary persistence fails", async () => {
    runIngestPreviewMock.mockResolvedValue({
      candidates: [{ id: "ignored" }],
      diagnostics: [
        { sourceKey: "gdelt_events", ok: true, candidateCount: 1, durationMs: 10, empty: false },
        {
          sourceKey: "iaea_news",
          ok: false,
          candidateCount: 0,
          durationMs: 20,
          empty: true,
          error: "403",
        },
      ],
      sourceHealth: [],
    });
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockRejectedValue(new Error("read-only filesystem"));
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { runScheduledIngest } = await import("@/lib/ingest/scheduled");
    const summary = await runScheduledIngest();

    expect(summary.candidateCount).toBe(1);
    expect(summary.failureCount).toBe(1);
    expect(summary.ok).toBe(false);
    expect(summary.diagnostics).toHaveLength(2);
    expect(warnSpy).toHaveBeenCalledWith(
      "[scheduled-ingest] unable to persist run summary",
      expect.any(Error)
    );
    expect(infoSpy).toHaveBeenCalledWith("[scheduled-ingest]", expect.any(String));
  });
});
