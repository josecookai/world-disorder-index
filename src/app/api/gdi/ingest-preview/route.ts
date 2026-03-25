import { NextResponse } from "next/server";
import { runIngestPreview } from "@/lib/ingest";

export async function GET() {
  const { candidates, diagnostics, sourceHealth } = await runIngestPreview();
  const previewCandidates = candidates.map((candidate) => ({
    source: candidate.source,
    sourceKey: candidate.sourceKey,
    impactDimension: candidate.impactDimension,
    title: candidate.title,
    occurredAt: candidate.occurredAt,
    confidence: candidate.confidence,
  }));

  return NextResponse.json(
    {
      count: previewCandidates.length,
      candidates: previewCandidates,
      diagnostics,
      sourceHealth,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    }
  );
}
