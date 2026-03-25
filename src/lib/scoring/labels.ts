import type { RiskLabel } from "@/lib/types";

export const RISK_LABELS: Array<{
  min: number;
  max: number;
  value: RiskLabel;
}> = [
  {
    min: 0,
    max: 20,
    value: {
      labelEn: "Peace Dividend",
      labelZh: "和平红利",
      descriptionZh: "世界总体稳定，冲突和系统性摩擦较低。",
    },
  },
  {
    min: 21,
    max: 40,
    value: {
      labelEn: "Fragile Stability",
      labelZh: "脆弱稳定",
      descriptionZh: "风险上升但未失控，全球仍处于可控失序。",
    },
  },
  {
    min: 41,
    max: 60,
    value: {
      labelEn: "Chronic Conflict",
      labelZh: "局部战争常态化",
      descriptionZh: "和平红利结束，冲突长期化并拖累预期。",
    },
  },
  {
    min: 61,
    max: 80,
    value: {
      labelEn: "Global Disorder",
      labelZh: "全球失序",
      descriptionZh: "多风险联动，系统承压明显。",
    },
  },
  {
    min: 81,
    max: 99,
    value: {
      labelEn: "Systemic War Risk",
      labelZh: "系统性战争风险",
      descriptionZh: "接近失控边缘，尾部风险被快速定价。",
    },
  },
  {
    min: 100,
    max: 100,
    value: {
      labelEn: "World War III",
      labelZh: "第三次世界大战",
      descriptionZh: "全球战争状态已形成。",
    },
  },
];

export function getRiskLabel(score: number): RiskLabel {
  const found = RISK_LABELS.find((item) => score >= item.min && score <= item.max);
  return found?.value ?? RISK_LABELS[RISK_LABELS.length - 1].value;
}
