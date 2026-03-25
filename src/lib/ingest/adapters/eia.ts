import { buildCandidateEvent, classifyDimensionFromText } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchText } from "@/lib/ingest/http";
import { parseSimpleRssItems } from "@/lib/ingest/parsers";

const EIA_PRESS_RSS_URL = "https://www.eia.gov/rss/press_rss.xml";

function toIsoDate(value?: string): string {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function toAbsoluteUrl(link: string): string {
  return link.startsWith("http") ? link : `https://www.eia.gov${link}`;
}

function toCandidateEvent(item: Record<string, string>): CandidateEvent | undefined {
  if (!item.title || !item.link) return undefined;

  const impactDimension =
    classifyDimensionFromText(`${item.title} ${item.description}`, [
      "energy_shipping",
      "trade_sanctions",
      "great_power_tension",
    ]) ?? "energy_shipping";

  return buildCandidateEvent("eia_energy", {
    title: item.title,
    source: "EIA",
    sourceUrl: toAbsoluteUrl(item.link),
    occurredAt: toIsoDate(item.pubDate),
    impactDimension,
    rawCategory: item.description,
    confidence: impactDimension === "energy_shipping" ? 0.85 : 0.8,
  });
}

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const xml = await fetchText(EIA_PRESS_RSS_URL, { timeoutMs: 15000 });

    return parseSimpleRssItems(xml)
      .map((item) => toCandidateEvent(item))
      .filter((item): item is CandidateEvent => Boolean(item));
  } catch (error) {
    console.error("[ingest][eia_energy]", error);
    return [];
  }
}
