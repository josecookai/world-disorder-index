import { buildCandidateEvent } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchText } from "@/lib/ingest/http";

const OFAC_SDN_CSV_URL = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV";

function buildRowSourceUrl(columns: string[], index: number): string {
  const rowKey = columns[0] || columns[1] || `entry-${index + 1}`;
  return `${OFAC_SDN_CSV_URL}#${encodeURIComponent(rowKey)}`;
}

function splitCsvLine(line: string): string[] {
  const cells = line.match(/("([^"]|"")*"|[^,]+)/g) ?? [];
  return cells.map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
}

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  try {
    const csv = await fetchText(OFAC_SDN_CSV_URL, {
      timeoutMs: 20000,
      cacheTtlMs: 6 * 60 * 60 * 1000,
      sourceKey: "ofac_sdn",
    });
    const rows = csv
      .split(/\r?\n/)
      .slice(0, 16)
      .map((line) => splitCsvLine(line))
      .filter((columns) => columns.length >= 4);

    return rows.map((columns, index) =>
      buildCandidateEvent("ofac_sdn", {
        title: `OFAC SDN update: ${columns[1] || columns[0] || `entry-${index + 1}`}`,
        source: "OFAC",
        sourceUrl: buildRowSourceUrl(columns, index),
        occurredAt: new Date().toISOString(),
        impactDimension: "trade_sanctions",
        rawCategory: columns[3],
        rawRegion: columns[2],
        confidence: 0.9,
      })
    );
  } catch (error) {
    console.error("[ingest][ofac_sdn]", error);
    return [];
  }
}
