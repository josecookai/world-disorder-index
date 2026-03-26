import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FetchCacheStatus } from "@/lib/ingest/http";
import { canUseLocalIngestState } from "@/lib/ingest/state";
import { getSourceByKey } from "@/lib/ingest/sources";

export type IngestSourceDiagnostic = {
  sourceKey: string;
  ok: boolean;
  candidateCount: number;
  durationMs: number;
  empty: boolean;
  error?: string;
  cacheStatus?: FetchCacheStatus;
  cacheAgeMs?: number;
};

export type IngestSourceHealthSnapshot = IngestSourceDiagnostic & {
  sourceName: string;
  checkedAt: string;
  consecutiveFailures: number;
  unhealthy: boolean;
};

type IngestHealthState = {
  runs: IngestSourceHealthSnapshot[];
};

const MAX_STORED_RUNS = 100;

function getIngestHealthPath() {
  return path.join(process.cwd(), "data", "ingest-health.json");
}

function getSourceName(sourceKey: string): string {
  return getSourceByKey(sourceKey)?.name ?? sourceKey;
}

async function ensureStateDir() {
  if (!canUseLocalIngestState()) return;
  await mkdir(path.dirname(getIngestHealthPath()), { recursive: true });
}

async function readState(): Promise<IngestHealthState> {
  if (!canUseLocalIngestState()) {
    return { runs: [] };
  }

  try {
    const raw = await readFile(getIngestHealthPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<IngestHealthState>;
    return { runs: Array.isArray(parsed.runs) ? parsed.runs : [] };
  } catch {
    return { runs: [] };
  }
}

async function writeState(state: IngestHealthState) {
  if (!canUseLocalIngestState()) return;
  await ensureStateDir();
  await writeFile(getIngestHealthPath(), JSON.stringify(state, null, 2), "utf8");
}

function getConsecutiveFailures(
  sourceKey: string,
  currentOk: boolean,
  previousRuns: IngestSourceHealthSnapshot[]
) {
  if (currentOk) return 0;

  let count = 1;
  const history = previousRuns
    .filter((run) => run.sourceKey === sourceKey)
    .sort((left, right) => right.checkedAt.localeCompare(left.checkedAt));

  for (const run of history) {
    if (run.ok) break;
    count += 1;
  }

  return count;
}

function toSnapshot(
  diagnostic: IngestSourceDiagnostic,
  checkedAt: string,
  previousRuns: IngestSourceHealthSnapshot[]
): IngestSourceHealthSnapshot {
  const consecutiveFailures = getConsecutiveFailures(diagnostic.sourceKey, diagnostic.ok, previousRuns);

  return {
    ...diagnostic,
    sourceName: getSourceName(diagnostic.sourceKey),
    checkedAt,
    consecutiveFailures,
    unhealthy: !diagnostic.ok || diagnostic.empty || consecutiveFailures >= 2,
  };
}

export type IngestSourceHealthSummary = {
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

export async function recordIngestDiagnostics(
  diagnostics: IngestSourceDiagnostic[]
): Promise<IngestSourceHealthSnapshot[]> {
  const state = await readState();
  const checkedAt = new Date().toISOString();
  const snapshots = diagnostics.map((diagnostic) => toSnapshot(diagnostic, checkedAt, state.runs));
  const runs = [...snapshots, ...state.runs].slice(0, MAX_STORED_RUNS);

  await writeState({ runs });

  return snapshots;
}

export async function getIngestSourceHealthSummaries(): Promise<IngestSourceHealthSummary[]> {
  const state = await readState();
  const latestBySource = new Map<string, IngestSourceHealthSnapshot>();

  for (const run of state.runs) {
    if (!latestBySource.has(run.sourceKey)) {
      latestBySource.set(run.sourceKey, run);
    }
  }

  return Array.from(latestBySource.values())
    .map((run) => ({
      sourceKey: run.sourceKey,
      sourceName: run.sourceName,
      lastCheckedAt: run.checkedAt,
      lastOk: run.ok,
      lastError: run.error,
      consecutiveFailures: run.consecutiveFailures,
      lastCandidateCount: run.candidateCount,
      lastDurationMs: run.durationMs,
      lastEmpty: run.empty,
      unhealthy: run.unhealthy,
    }))
    .sort((left, right) => {
      if (left.unhealthy !== right.unhealthy) {
        return left.unhealthy ? -1 : 1;
      }

      return left.sourceName.localeCompare(right.sourceName);
    });
}
