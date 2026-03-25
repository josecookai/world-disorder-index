export type CandidateEvent = {
  title: string;
  source: string;
  sourceUrl: string;
  occurredAt: string;
  impactDimension:
    | "military_conflict"
    | "great_power_tension"
    | "trade_sanctions"
    | "energy_shipping"
    | "nuclear_miscalculation";
  confidence: number;
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dedupeCandidates(items: CandidateEvent[]): CandidateEvent[] {
  const seen = new Set<string>();
  const result: CandidateEvent[] = [];

  for (const item of items) {
    const key = `${normalizeTitle(item.title)}|${item.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function filterByConfidence(items: CandidateEvent[], min = 0.55): CandidateEvent[] {
  return items.filter((item) => item.confidence >= min);
}
