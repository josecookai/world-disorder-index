import { buildCandidateEvent, classifyDimensionFromTextDetailed } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchJson } from "@/lib/ingest/http";
import { getSourcesForDimension } from "@/lib/ingest/sources";
import type { GdiDimensionKey } from "@/lib/types";

type GdeltArticle = {
  title?: string;
  url?: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

const DEFAULT_QUERY = [
  "war",
  "missile",
  "sanctions",
  "tariff",
  "shipping disruption",
  "uranium enrichment",
].join(" OR ");

function buildQueryUrl(): string {
  const params = new URLSearchParams({
    query: DEFAULT_QUERY,
    mode: "artlist",
    maxrecords: "25",
    format: "json",
    sort: "datedesc",
  });

  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

function normalizeOccurredAt(value?: string): string {
  if (!value) return new Date().toISOString();

  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return new Date(value).toISOString();

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const data = await fetchJson<GdeltResponse>(buildQueryUrl(), {
      timeoutMs: 15000,
      cacheTtlMs: 15 * 60 * 1000,
      sourceKey: "gdelt_events",
    });
    const preferredDimensions = [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ] satisfies GdiDimensionKey[];

    return (data.articles ?? [])
      .map((article) => {
        const title = article.title?.trim();
        const sourceUrl = article.url?.trim();
        if (!title || !sourceUrl) return undefined;

        const dimensionMatch = classifyDimensionFromTextDetailed(title, preferredDimensions);
        if (!dimensionMatch) return undefined;
        const impactDimension = dimensionMatch.dimension;

        const allowed = getSourcesForDimension(impactDimension).some(
          (source) => source.key === "gdelt_events"
        );
        if (!allowed) return undefined;

        return buildCandidateEvent("gdelt_events", {
          title,
          source: article.domain ?? "GDELT",
          sourceUrl,
          occurredAt: normalizeOccurredAt(article.seendate),
          impactDimension,
          explainability: {
            dimensionReason: dimensionMatch.dimensionReason,
            ruleFamily: dimensionMatch.ruleFamily,
            matchedKeywords: dimensionMatch.matchedKeywords,
          },
          rawRegion: article.sourcecountry,
        });
      })
      .filter((item): item is CandidateEvent => Boolean(item));
  } catch (error) {
    console.error("[ingest][gdelt_events]", error);
    return [];
  }
}
