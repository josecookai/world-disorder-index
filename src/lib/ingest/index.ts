import { fetchCandidates as fetchAcledCandidates } from "@/lib/ingest/adapters/acled";
import { fetchCandidates as fetchGdeltCandidates } from "@/lib/ingest/adapters/gdelt";
import { fetchCandidates as fetchIaeaCandidates } from "@/lib/ingest/adapters/iaea";
import { fetchCandidates as fetchOfacCandidates } from "@/lib/ingest/adapters/ofac";
import { fetchCandidates as fetchOpenSanctionsCandidates } from "@/lib/ingest/adapters/opensanctions";
import { compareCandidatePrecedence } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { dedupeCandidates, filterByConfidence } from "@/lib/ingest/normalize";

type AdapterDefinition = {
  key: string;
  fetchCandidates: () => Promise<CandidateEvent[]>;
};

export type IngestSourceDiagnostic = {
  sourceKey: string;
  ok: boolean;
  candidateCount: number;
  durationMs: number;
  error?: string;
};

export type IngestRunResult = {
  candidates: CandidateEvent[];
  diagnostics: IngestSourceDiagnostic[];
};

const ADAPTERS: AdapterDefinition[] = [
  { key: "gdelt_events", fetchCandidates: fetchGdeltCandidates },
  { key: "acled", fetchCandidates: fetchAcledCandidates },
  { key: "opensanctions", fetchCandidates: fetchOpenSanctionsCandidates },
  { key: "ofac_sdn", fetchCandidates: fetchOfacCandidates },
  { key: "iaea_news", fetchCandidates: fetchIaeaCandidates },
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
        error: toErrorMessage(error),
      },
    };
  }
}

export async function runIngestPreview(): Promise<IngestRunResult> {
  const results = await Promise.all(ADAPTERS.map((adapter) => runAdapter(adapter)));

  const merged = results.flatMap((result) => result.candidates);
  const ordered = merged.sort(compareCandidatePrecedence);

  return {
    candidates: filterByConfidence(dedupeCandidates(ordered)),
    diagnostics: results.map((result) => result.diagnostic),
  };
}

export async function fetchAllCandidates(): Promise<CandidateEvent[]> {
  const result = await runIngestPreview();
  return result.candidates;
}
