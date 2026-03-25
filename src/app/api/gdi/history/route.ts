import { NextRequest, NextResponse } from "next/server";
import { getHistoryByRange } from "@/lib/api/data";
import { historyQuerySchema } from "@/lib/api/schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parseResult = historyQuerySchema.safeParse({
    range: searchParams.get("range") ?? "3M",
  });

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid range parameter" }, { status: 400 });
  }

  const data = getHistoryByRange(parseResult.data.range);
  return NextResponse.json({ range: parseResult.data.range, records: data });
}
