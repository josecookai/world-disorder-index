import { buildCandidateEvent } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchText } from "@/lib/ingest/http";
import { parseSimpleRssItems } from "@/lib/ingest/parsers";

const IAEA_RSS_URL = "https://www.iaea.org/news/rss";

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const xml = await fetchText(IAEA_RSS_URL, { timeoutMs: 15000 });
    return parseSimpleRssItems(xml)
      .map((item) => {
        if (!item.title || !item.link) return undefined;

        return buildCandidateEvent("iaea_news", {
          title: item.title,
          source: "IAEA",
          sourceUrl: item.link,
          occurredAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          impactDimension: "nuclear_miscalculation",
          rawCategory: item.description,
        });
      })
      .filter((item): item is CandidateEvent => Boolean(item));
  } catch (error) {
    console.error("[ingest][iaea_news]", error);
    return [];
  }
}
