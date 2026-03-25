import { beforeEach, describe, expect, it, vi } from "vitest";

const isValidSecretMock = vi.fn();
const runScheduledIngestMock = vi.fn();

vi.mock("@/lib/ingest/scheduled", () => ({
  isValidIngestScheduleSecret: isValidSecretMock,
  runScheduledIngest: runScheduledIngestMock,
}));

describe("scheduled ingest route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when the scheduler secret is invalid", async () => {
    isValidSecretMock.mockReturnValue(false);
    const { GET } = await import("@/app/api/internal/ingest/scheduled/route");

    const response = await GET(
      new Request("http://localhost/api/internal/ingest/scheduled", {
        headers: { authorization: "Bearer wrong" },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Unauthorized",
    });
  });

  it("returns the run summary on success", async () => {
    isValidSecretMock.mockReturnValue(true);
    runScheduledIngestMock.mockResolvedValue({
      startedAt: "2026-03-25T00:00:00.000Z",
      completedAt: "2026-03-25T00:01:00.000Z",
      durationMs: 60000,
      ok: false,
      candidateCount: 2,
      failureCount: 1,
      diagnostics: [],
    });
    const { GET } = await import("@/app/api/internal/ingest/scheduled/route");

    const response = await GET(
      new Request("http://localhost/api/internal/ingest/scheduled", {
        headers: { authorization: "Bearer correct" },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toMatchObject({
      candidateCount: 2,
      failureCount: 1,
    });
  });
});
