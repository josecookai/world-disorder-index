import { getRiskLabel } from "@/lib/scoring/labels";
import { detectThresholdCross } from "@/lib/scoring/thresholds";
import type { GdiRecord } from "@/lib/types";

export type ScoreInput = Pick<
  GdiRecord,
  | "military_conflict"
  | "great_power_tension"
  | "trade_sanctions"
  | "energy_shipping"
  | "nuclear_miscalculation"
>;

export function calculateTotalScore(input: ScoreInput): number {
  const total =
    input.military_conflict +
    input.great_power_tension +
    input.trade_sanctions +
    input.energy_shipping +
    input.nuclear_miscalculation;
  return Math.max(0, Math.min(100, total));
}

export function enrichRecord(
  current: Omit<GdiRecord, "score_total" | "label_en" | "label_zh" | "wow_change">,
  previous?: Pick<GdiRecord, "score_total">
): GdiRecord & { thresholdCrosses: ReturnType<typeof detectThresholdCross> } {
  const score_total = calculateTotalScore(current);
  const label = getRiskLabel(score_total);
  const prev = previous?.score_total ?? score_total;
  const wow_change = score_total - prev;

  return {
    ...current,
    score_total,
    label_en: label.labelEn,
    label_zh: label.labelZh,
    wow_change,
    thresholdCrosses: detectThresholdCross(prev, score_total),
  };
}
