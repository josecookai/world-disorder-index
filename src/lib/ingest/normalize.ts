import type { CandidateEvent } from "@/lib/ingest/events";
import {
  compareCandidatePrecedence,
  getMinConfidenceForEvidenceType,
} from "@/lib/ingest/classify";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function getConflictKeys(item: CandidateEvent): string[] {
  const normalizedTitle = normalizeTitle(item.title);
  const occurredDay = item.occurredAt.slice(0, 10);
  const titleWithContext = `${normalizedTitle}|${item.impactDimension}|${occurredDay}`;

  return [
    item.sourceUrl.trim() ? `url:${item.sourceUrl.trim()}` : "",
    normalizedTitle ? `title:${titleWithContext}` : "",
    normalizedTitle ? `source:${titleWithContext}|${item.sourceKey}` : "",
    normalizedTitle ? `publisher:${titleWithContext}|${item.source}` : "",
  ].filter(Boolean);
}

export function dedupeCandidates(items: CandidateEvent[]): CandidateEvent[] {
  const selectedByKey = new Map<string, CandidateEvent>();
  const keysByCanonicalId = new Map<string, string[]>();

  for (const item of items) {
    const conflictKeys = getConflictKeys(item);
    const conflictingItems = conflictKeys
      .map((key) => selectedByKey.get(key))
      .filter((candidate): candidate is CandidateEvent => Boolean(candidate));

    const strongestConflict = conflictingItems.sort(compareCandidatePrecedence)[0];
    if (!strongestConflict) {
      for (const key of conflictKeys) {
        selectedByKey.set(key, item);
      }
      keysByCanonicalId.set(getCanonicalCandidateId(item), conflictKeys);
      continue;
    }

    if (compareCandidatePrecedence(item, strongestConflict) >= 0) continue;

    const strongestId = getCanonicalCandidateId(strongestConflict);
    const strongestKeys = keysByCanonicalId.get(strongestId) ?? getConflictKeys(strongestConflict);

    for (const key of strongestKeys) {
      selectedByKey.delete(key);
    }

    for (const key of conflictKeys) {
      selectedByKey.set(key, item);
    }

    keysByCanonicalId.delete(strongestId);
    keysByCanonicalId.set(getCanonicalCandidateId(item), conflictKeys);
  }

  return Array.from(new Set(selectedByKey.values())).sort(compareCandidatePrecedence);
}

function getCanonicalCandidateId(item: CandidateEvent): string {
  return [
    item.sourceKey,
    item.sourceUrl.trim(),
    normalizeTitle(item.title),
    item.impactDimension,
    item.occurredAt,
  ].join("|");
}

export function filterByConfidence(items: CandidateEvent[], min?: number): CandidateEvent[] {
  return items.filter((item) => {
    const threshold = min ?? getMinConfidenceForEvidenceType(item.evidenceType);
    return item.confidence >= threshold;
  });
}
