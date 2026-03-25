import { NextResponse } from "next/server";
import { publishLatestRecord } from "@/lib/publish-workflow";

export async function POST() {
  const result = await publishLatestRecord();
  return NextResponse.json({ ok: result.ok, message: result.message }, { status: result.status });
}
