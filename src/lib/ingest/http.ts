import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type FetchCacheStatus = "hit" | "miss" | "refresh" | "bypass";

type FetchMetric = {
  sourceKey: string;
  url: string;
  cacheStatus: FetchCacheStatus;
  cacheAgeMs?: number;
};

type CachedFetchEntry = {
  storedAt: string;
  body: string;
};

type FetchInit = RequestInit & {
  timeoutMs?: number;
  cacheTtlMs?: number;
  cacheKey?: string;
  sourceKey?: string;
};

const fetchMetrics = new Map<string, FetchMetric>();

function getCacheDir() {
  return process.env.INGEST_HTTP_CACHE_DIR
    ? path.resolve(process.env.INGEST_HTTP_CACHE_DIR)
    : path.join(process.cwd(), "data", "ingest-http-cache");
}

function getMetricKey(sourceKey: string, url: string) {
  return `${sourceKey}|${url}`;
}

function recordFetchMetric(metric: FetchMetric) {
  fetchMetrics.set(getMetricKey(metric.sourceKey, metric.url), metric);
}

export function takeFetchMetrics(): FetchMetric[] {
  const metrics = Array.from(fetchMetrics.values());
  fetchMetrics.clear();
  return metrics;
}

function getCacheFilePath(url: string, cacheKey?: string) {
  const key = cacheKey ?? url;
  const digest = createHash("sha256").update(key).digest("hex");
  return path.join(getCacheDir(), `${digest}.json`);
}

async function ensureCacheDir() {
  await mkdir(getCacheDir(), { recursive: true });
}

async function readCachedEntry(
  url: string,
  cacheKey?: string
): Promise<{ entry: CachedFetchEntry; ageMs: number } | null> {
  try {
    const raw = await readFile(getCacheFilePath(url, cacheKey), "utf8");
    const entry = JSON.parse(raw) as CachedFetchEntry;
    const ageMs = Date.now() - new Date(entry.storedAt).getTime();

    if (!entry.body || Number.isNaN(ageMs)) {
      return null;
    }

    return { entry, ageMs };
  } catch {
    return null;
  }
}

async function writeCachedEntry(url: string, body: string, cacheKey?: string) {
  await ensureCacheDir();
  await writeFile(
    getCacheFilePath(url, cacheKey),
    JSON.stringify({ storedAt: new Date().toISOString(), body } satisfies CachedFetchEntry, null, 2),
    "utf8"
  );
}

export async function fetchText(url: string, init?: FetchInit): Promise<string> {
  const { timeoutMs = 12000, cacheTtlMs = 0, cacheKey, sourceKey, ...requestInit } = init ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const cached = cacheTtlMs > 0 ? await readCachedEntry(url, cacheKey) : null;

  if (cached && cached.ageMs <= cacheTtlMs) {
    if (sourceKey) {
      recordFetchMetric({
        sourceKey,
        url,
        cacheStatus: "hit",
        cacheAgeMs: cached.ageMs,
      });
    }

    clearTimeout(timeoutId);
    return cached.entry.body;
  }

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
      headers: {
        "user-agent": "world-disorder-index/0.1",
        accept: "application/json, text/xml, application/xml, text/html;q=0.9, */*;q=0.8",
        ...(requestInit.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} ${response.statusText}`);
    }

    const body = await response.text();

    if (cacheTtlMs > 0) {
      await writeCachedEntry(url, body, cacheKey);
    }

    if (sourceKey) {
      recordFetchMetric({
        sourceKey,
        url,
        cacheStatus: cached ? "refresh" : cacheTtlMs > 0 ? "miss" : "bypass",
        cacheAgeMs: cached?.ageMs,
      });
    }

    return body;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJson<T>(url: string, init?: FetchInit): Promise<T> {
  const text = await fetchText(url, init);
  return JSON.parse(text) as T;
}
