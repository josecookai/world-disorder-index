import { buildCandidateEvent, classifyDimensionFromTextDetailed } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchText } from "@/lib/ingest/http";

type OpenSanctionsEntity = {
  id?: string;
  caption?: string;
  schema?: string;
  datasets?: string[];
  first_seen?: string;
  last_seen?: string;
  properties?: Record<string, unknown>;
};

const OPENSANCTIONS_TARGETS_URL =
  "https://data.opensanctions.org/datasets/latest/default/targets.nested.json";

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const payload = await fetchText(OPENSANCTIONS_TARGETS_URL, {
      timeoutMs: 20000,
      cacheTtlMs: 6 * 60 * 60 * 1000,
      sourceKey: "opensanctions",
    });
    const lines = payload
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 30);

    return lines
      .map((line) => {
        let entity: OpenSanctionsEntity;

        try {
          entity = JSON.parse(line) as OpenSanctionsEntity;
        } catch {
          return undefined;
        }

        const title = entity.caption?.trim();
        if (!title || !entity.id) return undefined;

        const description = [entity.schema, ...(entity.datasets ?? [])].filter(Boolean).join(" ");
        const dimensionMatch = classifyDimensionFromTextDetailed(description, [
          "trade_sanctions",
          "great_power_tension",
        ]);
        const impactDimension = dimensionMatch?.dimension ?? "trade_sanctions";

        return buildCandidateEvent("opensanctions", {
          title: `OpenSanctions target: ${title}`,
          source: "OpenSanctions",
          sourceUrl: `https://www.opensanctions.org/entities/${entity.id}/`,
          occurredAt: entity.last_seen ?? entity.first_seen ?? new Date().toISOString(),
          impactDimension,
          explainability: {
            dimensionReason:
              dimensionMatch?.dimensionReason ??
              "Defaulted to trade_sanctions because sanctions entities are ingest-priority targets.",
            ruleFamily: dimensionMatch?.ruleFamily ?? "sanctions_default",
            matchedKeywords: dimensionMatch?.matchedKeywords ?? [],
          },
          rawCategory: entity.schema,
        });
      })
      .filter((item): item is CandidateEvent => Boolean(item));
  } catch (error) {
    console.error("[ingest][opensanctions]", error);
    return [];
  }
}
