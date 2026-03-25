import { z } from "zod";

export const gdiRecordSchema = z.object({
  date: z.string(),
  score_total: z.number().min(0).max(100),
  label_en: z.string(),
  label_zh: z.string(),
  wow_change: z.number(),
  military_conflict: z.number().min(0).max(20),
  great_power_tension: z.number().min(0).max(20),
  trade_sanctions: z.number().min(0).max(20),
  energy_shipping: z.number().min(0).max(20),
  nuclear_miscalculation: z.number().min(0).max(20),
  drivers: z.array(z.string()),
  summary: z.string(),
});

export const historyQuerySchema = z.object({
  range: z.enum(["1M", "3M", "6M", "12M", "All"]).default("3M"),
});

export type GdiRecordDto = z.infer<typeof gdiRecordSchema>;
