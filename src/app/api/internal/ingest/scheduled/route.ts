import { NextResponse } from "next/server";
import { isValidIngestScheduleSecret, runScheduledIngest } from "@/lib/ingest/scheduled";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAuthToken(request: Request): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-ingest-schedule-secret");
}

async function handleScheduledIngest(request: Request) {
  if (!isValidIngestScheduleSecret(getAuthToken(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runScheduledIngest();
    return NextResponse.json(summary, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduled ingest error";
    console.error("[scheduled-ingest] fatal", error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleScheduledIngest(request);
}

export async function POST(request: Request) {
  return handleScheduledIngest(request);
}
