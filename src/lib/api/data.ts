import { mockLatestRecord, mockPublishedRecords } from "@/lib/mock/records";
import type { GdiRecord } from "@/lib/types";

function monthsAgo(dateStr: string, months: number): Date {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() - months);
  return date;
}

export function getLatestRecord(): GdiRecord {
  return mockLatestRecord;
}

export function getHistoryByRange(range: "1M" | "3M" | "6M" | "12M" | "All"): GdiRecord[] {
  if (range === "All") return mockPublishedRecords;

  const latest = mockLatestRecord;
  const months = Number(range.replace("M", ""));
  const threshold = monthsAgo(latest.date, months);

  return mockPublishedRecords.filter((row) => new Date(row.date) >= threshold);
}
