import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson, fetchText, takeFetchMetrics } from "@/lib/ingest/http";

describe("ingest http cache", () => {
  let cacheDir: string;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    cacheDir = await mkdtemp(path.join(os.tmpdir(), "ingest-http-cache-"));
    vi.stubEnv("INGEST_HTTP_CACHE_DIR", cacheDir);
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));
    fetchMock.mockReset();
    takeFetchMetrics();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    await rm(cacheDir, { recursive: true, force: true });
  });

  it("reuses a fresh cached response within the configured ttl", async () => {
    fetchMock.mockResolvedValue(
      new Response("cached-body", { status: 200, statusText: "OK" })
    );

    await expect(
      fetchText("https://example.com/feed.json", {
        cacheTtlMs: 60_000,
        sourceKey: "gdelt_events",
      })
    ).resolves.toBe("cached-body");
    await expect(
      fetchText("https://example.com/feed.json", {
        cacheTtlMs: 60_000,
        sourceKey: "gdelt_events",
      })
    ).resolves.toBe("cached-body");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(takeFetchMetrics()).toEqual([
      {
        sourceKey: "gdelt_events",
        url: "https://example.com/feed.json",
        cacheStatus: "hit",
        cacheAgeMs: 0,
      },
    ]);
  });

  it("refreshes cached content after ttl expiry", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("first", { status: 200, statusText: "OK" }))
      .mockResolvedValueOnce(new Response("second", { status: 200, statusText: "OK" }));

    await expect(
      fetchText("https://example.com/feed.xml", {
        cacheTtlMs: 1_000,
        sourceKey: "iaea_news",
      })
    ).resolves.toBe("first");

    vi.setSystemTime(new Date("2026-03-25T00:00:02.000Z"));

    await expect(
      fetchText("https://example.com/feed.xml", {
        cacheTtlMs: 1_000,
        sourceKey: "iaea_news",
      })
    ).resolves.toBe("second");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(takeFetchMetrics()).toEqual([
      {
        sourceKey: "iaea_news",
        url: "https://example.com/feed.xml",
        cacheStatus: "refresh",
        cacheAgeMs: 2000,
      },
    ]);
  });

  it("does not serve stale cache entries after an upstream failure", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200, statusText: "OK" }));

    await expect(
      fetchJson<{ ok: boolean }>("https://example.com/data.json", {
        cacheTtlMs: 1_000,
        sourceKey: "opensanctions",
      })
    ).resolves.toEqual({ ok: true });

    vi.setSystemTime(new Date("2026-03-25T00:00:05.000Z"));
    fetchMock.mockRejectedValueOnce(new Error("upstream down"));

    await expect(
      fetchJson<{ ok: boolean }>("https://example.com/data.json", {
        cacheTtlMs: 1_000,
        sourceKey: "opensanctions",
      })
    ).rejects.toThrow("upstream down");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
