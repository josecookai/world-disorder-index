export type GdiDimensionKey =
  | "military_conflict"
  | "great_power_tension"
  | "trade_sanctions"
  | "energy_shipping"
  | "nuclear_miscalculation";

export type RiskLabel = {
  labelEn: string;
  labelZh: string;
  descriptionZh: string;
};

export type GdiRecord = {
  id?: string;
  date: string;
  score_total: number;
  label_en: string;
  label_zh: string;
  wow_change: number;
  mom_change?: number;
  military_conflict: number;
  great_power_tension: number;
  trade_sanctions: number;
  energy_shipping: number;
  nuclear_miscalculation: number;
  drivers: string[];
  summary: string;
  updated_at?: string;
  status?: "draft" | "reviewed" | "published";
  score_reason?: string;
  reviewed_by?: string;
  published_at?: string;
};

export type DimensionMeta = {
  key: GdiDimensionKey;
  nameZh: string;
  nameEn: string;
  shortReason: string;
};

export const DIMENSION_META: DimensionMeta[] = [
  {
    key: "military_conflict",
    nameZh: "军事冲突强度",
    nameEn: "Military Conflict",
    shortReason: "多战区冲突热度与扩散风险",
  },
  {
    key: "great_power_tension",
    nameZh: "大国对抗程度",
    nameEn: "Great Power Tension",
    shortReason: "主要力量之间的战略对抗水平",
  },
  {
    key: "trade_sanctions",
    nameZh: "贸易/制裁破坏度",
    nameEn: "Trade & Sanctions",
    shortReason: "全球贸易链与制裁冲击强度",
  },
  {
    key: "energy_shipping",
    nameZh: "能源/航运压力",
    nameEn: "Energy & Shipping",
    shortReason: "油运、海运与保险成本压力",
  },
  {
    key: "nuclear_miscalculation",
    nameZh: "核风险/误判风险",
    nameEn: "Nuclear/Miscalculation",
    shortReason: "战略误判与尾部事件风险",
  },
];
