import { fetchCandidates as fetchAcledCandidates } from "@/lib/ingest/adapters/acled";
import { fetchCandidates as fetchGdeltCandidates } from "@/lib/ingest/adapters/gdelt";
import { fetchCandidates as fetchIaeaCandidates } from "@/lib/ingest/adapters/iaea";
import { fetchCandidates as fetchOfacCandidates } from "@/lib/ingest/adapters/ofac";
import { fetchCandidates as fetchOpenSanctionsCandidates } from "@/lib/ingest/adapters/opensanctions";
import type { CandidateEvent } from "@/lib/ingest/events";
import { dedupeCandidates, filterByConfidence } from "@/lib/ingest/normalize";

const ADAPTERS = [
  fetchGdeltCandidates,
  fetchAcledCandidates,
  fetchOpenSanctionsCandidates,
  fetchOfacCandidates,
  fetchIaeaCandidates,
];

export async function fetchAllCandidates(): Promise<CandidateEvent[]> {
  const results = await Promise.allSettled(ADAPTERS.map((adapter) => adapter()));

  const merged = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  return filterByConfidence(dedupeCandidates(merged), 0.6);
}
