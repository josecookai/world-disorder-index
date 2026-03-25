"use client";

import { useEffect, useState } from "react";

type IngestPreviewCandidate = {
  title: string;
  source: string;
  occurredAt: string;
  impactDimension: string;
};

type IngestPreviewResponse = {
  count: number;
  candidates: IngestPreviewCandidate[];
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
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
          当前没有可供预览的候选事件。说明本轮 ingest 没有返回通过筛选的 candidates。
        </div>
      ) : null}

      {!loading && !error && data && data.count > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total Count</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{data.count}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Preview Scope</p>
              <p className="mt-2 text-sm text-zinc-700">
                当前表格显示 source、dimension、title、occurredAt，供 admin 在正式审核前快速扫读。
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Dimension</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Occurred At</th>
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
