import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: true,
      message:
        "MVP uses mock data. Replace with Supabase insert/update and status transition (reviewed -> published).",
    },
    { status: 200 }
  );
}
