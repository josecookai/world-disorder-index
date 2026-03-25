const THRESHOLDS = [40, 60, 80] as const;

export type ThresholdCross = {
  threshold: number;
  direction: "up" | "down";
};

export function detectThresholdCross(prevScore: number, nextScore: number): ThresholdCross[] {
  const result: ThresholdCross[] = [];
  for (const threshold of THRESHOLDS) {
    if (prevScore < threshold && nextScore >= threshold) {
      result.push({ threshold, direction: "up" });
    }
    if (prevScore >= threshold && nextScore < threshold) {
      result.push({ threshold, direction: "down" });
    }
  }
  return result;
}
