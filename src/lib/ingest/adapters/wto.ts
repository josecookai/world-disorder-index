import { buildCandidateEvent, classifyDimensionFromText } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchText } from "@/lib/ingest/http";
import { parseSimpleRssItems } from "@/lib/ingest/parsers";

const WTO_RSS_URL = "https://www.wto.org/library/rss/latest_news_e.xml";

function toIsoDate(value?: string): string {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function toCandidateEvent(item: Record<string, string>): CandidateEvent | undefined {
  if (!item.title || !item.link) return undefined;

  const impactDimension =
    classifyDimensionFromText(`${item.title} ${item.description}`, [
      "trade_sanctions",
      "energy_shipping",
      "great_power_tension",
    ]) ?? "trade_sanctions";

  return buildCandidateEvent("wto_news", {
    title: item.title,
    source: "WTO",
    sourceUrl: item.link,
    occurredAt: toIsoDate(item.pubDate),
    impactDimension,
    rawCategory: item.description,
    confidence: impactDimension === "trade_sanctions" ? 0.83 : 0.8,
  });
}

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const xml = await fetchText(WTO_RSS_URL, { timeoutMs: 15000 });

    return parseSimpleRssItems(xml)
      .map((item) => toCandidateEvent(item))
      .filter((item): item is CandidateEvent => Boolean(item));
  } catch (error) {
    console.error("[ingest][wto_news]", error);
    return [];
  }
}
