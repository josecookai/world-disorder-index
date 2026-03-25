import { fetchCandidates as fetchAcledCandidates } from "@/lib/ingest/adapters/acled";
import { fetchCandidates as fetchGdeltCandidates } from "@/lib/ingest/adapters/gdelt";
import { fetchCandidates as fetchEiaCandidates } from "@/lib/ingest/adapters/eia";
import { fetchCandidates as fetchIaeaCandidates } from "@/lib/ingest/adapters/iaea";
import { fetchCandidates as fetchOfacCandidates } from "@/lib/ingest/adapters/ofac";
import { fetchCandidates as fetchOpenSanctionsCandidates } from "@/lib/ingest/adapters/opensanctions";
import { fetchCandidates as fetchUnSecurityCouncilCandidates } from "@/lib/ingest/adapters/un-security-council";
import { fetchCandidates as fetchWtoCandidates } from "@/lib/ingest/adapters/wto";
import { compareCandidatePrecedence } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import {
  getIngestSourceHealthSummaries,
  recordIngestDiagnostics,
  type IngestSourceDiagnostic,
  type IngestSourceHealthSummary,
} from "@/lib/ingest/health";
import { takeFetchMetrics } from "@/lib/ingest/http";
import { dedupeCandidates, filterByConfidence } from "@/lib/ingest/normalize";

type AdapterDefinition = {
  key: string;
  fetchCandidates: () => Promise<CandidateEvent[]>;
};

export type IngestRunResult = {
  candidates: CandidateEvent[];
  diagnostics: IngestSourceDiagnostic[];
  sourceHealth: IngestSourceHealthSummary[];
};

const ADAPTERS: AdapterDefinition[] = [
  { key: "gdelt_events", fetchCandidates: fetchGdeltCandidates },
  { key: "acled", fetchCandidates: fetchAcledCandidates },
  { key: "opensanctions", fetchCandidates: fetchOpenSanctionsCandidates },
  { key: "ofac_sdn", fetchCandidates: fetchOfacCandidates },
  { key: "iaea_news", fetchCandidates: fetchIaeaCandidates },
  { key: "wto_news", fetchCandidates: fetchWtoCandidates },
  { key: "eia_energy", fetchCandidates: fetchEiaCandidates },
  { key: "un_security_council", fetchCandidates: fetchUnSecurityCouncilCandidates },
];

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown adapter error";
}

async function runAdapter(adapter: AdapterDefinition): Promise<{
  candidates: CandidateEvent[];
  diagnostic: IngestSourceDiagnostic;
}> {
  const startedAt = Date.now();

  try {
    const candidates = await adapter.fetchCandidates();
    return {
      candidates,
      diagnostic: {
        sourceKey: adapter.key,
        ok: true,
        candidateCount: candidates.length,
        durationMs: Date.now() - startedAt,
        empty: candidates.length === 0,
      },
    };
  } catch (error) {
    return {
      candidates: [],
      diagnostic: {
        sourceKey: adapter.key,
        ok: false,
        candidateCount: 0,
        durationMs: Date.now() - startedAt,
        empty: true,
        error: toErrorMessage(error),
      },
    };
  }
}

export async function runIngestPreview(): Promise<IngestRunResult> {
  const results = await Promise.all(ADAPTERS.map((adapter) => runAdapter(adapter)));
  const fetchMetrics = takeFetchMetrics();

  const merged = results.flatMap((result) => result.candidates);
  const ordered = merged.sort(compareCandidatePrecedence);
  const diagnostics = results.map((result) => {
    const metric = fetchMetrics.find((entry) => entry.sourceKey === result.diagnostic.sourceKey);

    return metric
      ? {
          ...result.diagnostic,
          cacheStatus: metric.cacheStatus,
          cacheAgeMs: metric.cacheAgeMs,
        }
      : result.diagnostic;
  });
  let sourceHealth: IngestSourceHealthSummary[] = [];

  try {
    await recordIngestDiagnostics(diagnostics);
    sourceHealth = await getIngestSourceHealthSummaries();
  } catch (error) {
    console.warn("[ingest-health] persistence unavailable", error);
  }

  return {
    candidates: filterByConfidence(dedupeCandidates(ordered)),
    diagnostics,
    sourceHealth,
  };
}

export async function fetchAllCandidates(): Promise<CandidateEvent[]> {
  const result = await runIngestPreview();
  return result.candidates;
}
