"use client";

import { useEffect, useState } from "react";

type IngestPreviewCandidate = {
  title: string;
  source: string;
  sourceKey: string;
  occurredAt: string;
  impactDimension: string;
  confidence: number;
};

type IngestSourceDiagnostic = {
  sourceKey: string;
  ok: boolean;
  candidateCount: number;
  durationMs: number;
  empty: boolean;
  error?: string;
};

type IngestSourceHealth = {
  sourceKey: string;
  sourceName: string;
  lastCheckedAt: string | null;
  lastOk: boolean | null;
  lastError?: string;
  consecutiveFailures: number;
  lastCandidateCount: number;
  lastDurationMs: number;
  lastEmpty: boolean;
  unhealthy: boolean;
};

type IngestPreviewResponse = {
  count: number;
  candidates: IngestPreviewCandidate[];
  diagnostics: IngestSourceDiagnostic[];
  sourceHealth: IngestSourceHealth[];
};

function formatOccurredAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  }).format(date);
}

function getDimensionLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getHealthTone(unhealthy: boolean) {
  return unhealthy
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-emerald-300 bg-emerald-50 text-emerald-900";
}

function renderDiagnostics(data: IngestPreviewResponse) {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Count</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{data.count}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Preview Scope</p>
          <p className="mt-2 text-sm text-zinc-700">
            当前页面同时展示候选事件和 source diagnostics，便于 admin 判断哪些 source 健康、哪些 source 需要关注。
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.sourceHealth.map((item) => (
          <article key={item.sourceKey} className={`rounded-xl border p-4 ${getHealthTone(item.unhealthy)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.sourceName}</p>
                <p className="mt-1 text-xs uppercase tracking-wide">{item.sourceKey}</p>
              </div>
              <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium">
                {item.unhealthy ? "Needs Attention" : "Healthy"}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <p>Last run: {item.lastCheckedAt ? formatOccurredAt(item.lastCheckedAt) : "never"}</p>
              <p>Candidate count: {item.lastCandidateCount}</p>
              <p>Duration: {item.lastDurationMs} ms</p>
              <p>Empty result: {item.lastEmpty ? "yes" : "no"}</p>
              <p>Repeated failures: {item.consecutiveFailures}</p>
            </div>
            {item.lastError ? <p className="mt-3 text-xs">{item.lastError}</p> : null}
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Count</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white text-zinc-700">
            {data.diagnostics.map((item) => (
              <tr key={item.sourceKey}>
                <td className="px-4 py-3 text-xs font-medium text-zinc-900">{item.sourceKey}</td>
                <td className="px-4 py-3 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      item.ok && !item.empty ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {item.ok ? (item.empty ? "Empty" : "Success") : "Failure"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{item.candidateCount}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{item.durationMs} ms</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {item.error ?? (item.empty ? "No candidates returned" : "OK")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IngestPreviewPanel() {
  const [data, setData] = useState<IngestPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/gdi/ingest-preview", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as IngestPreviewResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "unknown error";
          setError(`无法加载 ingest preview：${message}`);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Ingest Preview</h2>
          <p className="mt-1 text-sm text-zinc-600">
            内部 ingest 候选事件预览，用于人工快速核对，不会写入审核决策，也不会影响公开首页。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
            Admin Only
          </span>
          <button
            type="button"
            onClick={() => setRefreshToken((value) => value + 1)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            Refresh
          </button>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
            Total {data?.count ?? 0}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
            正在加载 ingest preview 候选事件...
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            正在拉取最新内部预览数据。
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-medium">无法显示 ingest preview</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {!loading && !error && data?.count === 0 ? (
        <>
          {renderDiagnostics(data)}
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
            当前没有可供预览的候选事件。说明本轮 ingest 没有返回通过筛选的 candidates。
          </div>
        </>
      ) : null}

      {!loading && !error && data && data.count > 0 ? (
        <div className="mt-4 space-y-4">
          {renderDiagnostics(data)}

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Dimension</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Occurred At</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white text-zinc-700">
                {data.candidates.map((candidate) => {
                  const key = [
                    candidate.source,
                    candidate.impactDimension,
                    candidate.title,
                    candidate.occurredAt,
                  ].join("|");

                  return (
                    <tr key={key} className="align-top">
                      <td className="px-4 py-3 text-xs font-medium text-zinc-700">
                        {candidate.source}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {getDimensionLabel(candidate.impactDimension)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900">{candidate.title}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {formatOccurredAt(candidate.occurredAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {candidate.confidence.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
