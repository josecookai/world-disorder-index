import { buildCandidateEvent, classifyDimensionFromText } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchText } from "@/lib/ingest/http";

const UN_SECURITY_COUNCIL_URL = "https://press.un.org/en/content/security-council";

type ParsedArticle = {
  title: string;
  sourceUrl: string;
  occurredAt: string;
  summary?: string;
};

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseArticles(html: string): ParsedArticle[] {
  const rows = html.match(/<div class="views-row">[\s\S]*?<\/article>\s*<\/div>/g) ?? [];

  return rows
    .map<ParsedArticle | undefined>((row) => {
      const dateMatch = row.match(/<time datetime="([^"]+)"/i);
      const linkMatch = row.match(/<h3><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h3>/i);
      const summaryMatch = row.match(
        /<div class="field field--name-body[\s\S]*?<div class="field__item"><p>([\s\S]*?)<\/p>/i
      );

      const title = linkMatch ? stripTags(linkMatch[2]) : "";
      const href = linkMatch ? linkMatch[1].trim() : "";
      const occurredAt = dateMatch?.[1]?.trim() ?? "";
      const summary = summaryMatch ? stripTags(summaryMatch[1]) : undefined;

      if (!title || !href || !occurredAt) return undefined;
      if (title.toLowerCase().includes("live blog")) return undefined;

      return {
        title,
        sourceUrl: href.startsWith("http") ? href : `https://press.un.org${href}`,
        occurredAt,
        summary,
      };
    })
    .filter((item): item is ParsedArticle => item !== undefined);
}

function toCandidateEvent(article: ParsedArticle): CandidateEvent {
  const impactDimension =
    classifyDimensionFromText(`${article.title} ${article.summary ?? ""}`, [
      "great_power_tension",
      "military_conflict",
      "nuclear_miscalculation",
    ]) ?? "great_power_tension";

  return buildCandidateEvent("un_security_council", {
    title: article.title,
    source: "UN Security Council",
    sourceUrl: article.sourceUrl,
    occurredAt: article.occurredAt,
    impactDimension,
    rawCategory: article.summary,
    confidence: impactDimension === "great_power_tension" ? 0.84 : 0.82,
  });
}

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const html = await fetchText(UN_SECURITY_COUNCIL_URL, { timeoutMs: 15000 });

    return parseArticles(html).map((article) => toCandidateEvent(article));
  } catch (error) {
    console.error("[ingest][un_security_council]", error);
    return [];
  }
}
