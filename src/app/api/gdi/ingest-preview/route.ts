import { NextResponse } from "next/server";
import { fetchAllCandidates } from "@/lib/ingest";

export async function GET() {
  const candidates = await fetchAllCandidates();

  return NextResponse.json(
    {
      count: candidates.length,
      candidates,
    },
    { status: 200 }
  );
}
