import { enrichRecord } from "@/lib/scoring/engine";
import type { GdiRecord } from "@/lib/types";

const baseRecords: Array<Omit<GdiRecord, "score_total" | "label_en" | "label_zh" | "wow_change">> =
  [
    {
      date: "2026-03-04",
      military_conflict: 7,
      great_power_tension: 6,
      trade_sanctions: 5,
      energy_shipping: 5,
      nuclear_miscalculation: 5,
      drivers: ["俄乌冲突持续", "贸易摩擦升温", "中东局势波动"],
      summary: "全球秩序较和平期更脆弱，但尚在可控区间。",
      status: "published",
    },
    {
      date: "2026-03-11",
      military_conflict: 8,
      great_power_tension: 7,
      trade_sanctions: 6,
      energy_shipping: 6,
      nuclear_miscalculation: 5,
      drivers: ["中东风险抬升", "航运预期承压", "大国博弈增强"],
      summary: "多风险并行抬升，市场对地缘 headline 更敏感。",
      status: "published",
    },
    {
      date: "2026-03-18",
      military_conflict: 8,
      great_power_tension: 7,
      trade_sanctions: 6,
      energy_shipping: 7,
      nuclear_miscalculation: 6,
      drivers: ["红海航运风险抬升", "俄乌未降温", "全球贸易摩擦延续"],
      summary: "世界比和平时期更危险，但尚未进入系统性失控。",
      status: "published",
    },
    {
      date: "2026-03-25",
      military_conflict: 8,
      great_power_tension: 7,
      trade_sanctions: 6,
      energy_shipping: 7,
      nuclear_miscalculation: 6,
      drivers: [
        "俄乌战争持续，未见明显降温",
        "中东局势升温，航运预期承压",
        "贸易摩擦继续扰动全球信心",
        "大国对抗增强，但尚未直接开战",
      ],
      summary: "世界比和平时期更危险，但还没有进入系统性失控。",
      status: "published",
    },
  ];

const enriched = baseRecords.reduce<GdiRecord[]>((acc, current) => {
  const previous = acc.at(-1);
  const record = enrichRecord(current, previous);
  acc.push(record);
  return acc;
}, []);

export const mockPublishedRecords = enriched;
export const mockLatestRecord = enriched[enriched.length - 1];
