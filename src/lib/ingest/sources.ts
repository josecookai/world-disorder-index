export type SourceConfig = {
  key: string;
  name: string;
  baseUrl: string;
  reliability: "high" | "medium" | "low";
};

export const SOURCE_CONFIGS: SourceConfig[] = [
  {
    key: "reuters_world",
    name: "Reuters World",
    baseUrl: "https://www.reuters.com/world/",
    reliability: "high",
  },
  {
    key: "ap_world",
    name: "AP World",
    baseUrl: "https://apnews.com/world-news",
    reliability: "high",
  },
  {
    key: "financial_times_world",
    name: "FT World",
    baseUrl: "https://www.ft.com/world",
    reliability: "medium",
  },
];
