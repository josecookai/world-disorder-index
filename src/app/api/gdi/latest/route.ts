import { NextResponse } from "next/server";
import { getLatestRecord } from "@/lib/api/data";
import { gdiRecordSchema } from "@/lib/api/schemas";

export async function GET() {
  const latest = getLatestRecord();
  const parsed = gdiRecordSchema.safeParse(latest);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid latest record payload" }, { status: 500 });
  }
  return NextResponse.json(parsed.data);
}
