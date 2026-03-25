import { NextResponse } from "next/server";
import { getLatestRecord } from "@/lib/api/data";

export async function GET() {
  const latest = getLatestRecord();
  return NextResponse.json({
    date: latest.date,
    drivers: latest.drivers,
    summary: latest.summary,
  });
}
