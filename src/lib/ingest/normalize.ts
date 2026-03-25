import type { CandidateEvent } from "@/lib/ingest/events";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dedupeCandidates(items: CandidateEvent[]): CandidateEvent[] {
  const seen = new Set<string>();
  const result: CandidateEvent[] = [];

  for (const item of items) {
    const dedupeKeys = [
      item.sourceUrl.trim(),
      `${normalizeTitle(item.title)}|${item.sourceKey}`,
      `${normalizeTitle(item.title)}|${item.source}`,
    ].filter(Boolean);

    if (dedupeKeys.some((key) => seen.has(key))) continue;

    for (const key of dedupeKeys) {
      seen.add(key);
    }
    result.push(item);
  }

  return result;
}

export function filterByConfidence(items: CandidateEvent[], min = 0.55): CandidateEvent[] {
  return items.filter((item) => item.confidence >= min);
}
