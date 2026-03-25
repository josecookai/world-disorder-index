import type { GdiDimensionKey } from "@/lib/types";

export type SourceKind =
  | "official_dataset"
  | "official_feed"
  | "event_api"
  | "news_api"
  | "publisher_feed"
  | "github_dataset";

export type SourceAccess =
  | "free"
  | "free_with_registration"
  | "free_limited"
  | "unknown";

export type SourcePriority = "P0" | "P1" | "P2" | "P3";

export type IngestMethod =
  | "api_json"
  | "rss_xml"
  | "html_parse"
  | "csv_download"
  | "json_file"
  | "github_sync";

export type UpdateCadence = "near_real_time" | "hourly" | "daily" | "weekly" | "irregular";

export type SourceConfig = {
  key: string;
  name: string;
  description: string;
  homepageUrl: string;
  baseUrl?: string;
  kind: SourceKind;
  access: SourceAccess;
  reliability: "high" | "medium" | "low";
  priority: SourcePriority;
  ingestMethod: IngestMethod;
  updateCadence: UpdateCadence;
  dimensions: GdiDimensionKey[];
  keywords?: string[];
  regions?: string[];
  implementationNotes: string;
  enabled: boolean;
};

export const DEFAULT_CONFIDENCE_BY_KIND: Record<SourceKind, number> = {
  official_dataset: 0.9,
  event_api: 0.85,
  official_feed: 0.8,
  github_dataset: 0.75,
  publisher_feed: 0.7,
  news_api: 0.6,
};

const P0_SOURCE_CONFIGS: SourceConfig[] = [
  {
    key: "gdelt_events",
    name: "GDELT Events",
    description: "Global event and news metadata stream used as the main discovery layer.",
    homepageUrl: "https://www.gdeltproject.org/",
    baseUrl: "https://api.gdeltproject.org/",
    kind: "event_api",
    access: "free",
    reliability: "high",
    priority: "P0",
    ingestMethod: "api_json",
    updateCadence: "near_real_time",
    dimensions: [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ],
    keywords: [],
    implementationNotes:
      "Use as the discovery backbone. Adapters should apply dimension-specific keyword filters.",
    enabled: true,
  },
  {
    key: "acled",
    name: "ACLED",
    description: "Structured conflict event data for war, violence, and escalation tracking.",
    homepageUrl: "https://acleddata.com/",
    baseUrl: "https://acleddata.com/acled-api-documentation",
    kind: "event_api",
    access: "free_with_registration",
    reliability: "high",
    priority: "P0",
    ingestMethod: "api_json",
    updateCadence: "daily",
    dimensions: ["military_conflict", "great_power_tension"],
    keywords: [],
    implementationNotes:
      "Prefer direct event categories instead of relying on keyword-only classification.",
    enabled: true,
  },
  {
    key: "opensanctions",
    name: "OpenSanctions",
    description: "Open sanctions and entity-risk dataset for sanctions monitoring.",
    homepageUrl: "https://www.opensanctions.org/",
    baseUrl: "https://github.com/opensanctions/opensanctions",
    kind: "github_dataset",
    access: "free",
    reliability: "high",
    priority: "P0",
    ingestMethod: "github_sync",
    updateCadence: "daily",
    dimensions: ["trade_sanctions", "great_power_tension"],
    keywords: [],
    implementationNotes:
      "Use dataset diffs or snapshot comparisons to detect sanctions additions and removals.",
    enabled: true,
  },
  {
    key: "ofac_sdn",
    name: "OFAC Sanctions",
    description: "Official U.S. sanctions dataset for sanctions events and enforcement updates.",
    homepageUrl: "https://home.treasury.gov/",
    baseUrl: "https://ofac.treasury.gov/",
    kind: "official_dataset",
    access: "free",
    reliability: "high",
    priority: "P0",
    ingestMethod: "json_file",
    updateCadence: "daily",
    dimensions: ["trade_sanctions"],
    keywords: [],
    implementationNotes:
      "Treat as authoritative sanctions data and ingest with delta-aware comparison logic.",
    enabled: true,
  },
  {
    key: "iaea_news",
    name: "IAEA News",
    description: "Official nuclear safety, safeguards, and incident-related updates.",
    homepageUrl: "https://www.iaea.org/",
    baseUrl: "https://www.iaea.org/newscenter",
    kind: "official_feed",
    access: "free",
    reliability: "high",
    priority: "P0",
    ingestMethod: "rss_xml",
    updateCadence: "daily",
    dimensions: ["nuclear_miscalculation"],
    keywords: [],
    implementationNotes:
      "Use for nuclear-related official updates. Volume is low but signal quality is high.",
    enabled: true,
  },
];

const P1_SOURCE_CONFIGS: SourceConfig[] = [
  {
    key: "wto_news",
    name: "WTO News",
    description: "Official WTO coverage of trade disputes, negotiations, and policy changes.",
    homepageUrl: "https://www.wto.org/",
    baseUrl: "https://www.wto.org/english/news_e/news_e.htm",
    kind: "official_feed",
    access: "free",
    reliability: "high",
    priority: "P1",
    ingestMethod: "rss_xml",
    updateCadence: "weekly",
    dimensions: ["trade_sanctions", "energy_shipping"],
    implementationNotes:
      "Use as high-confidence trade policy context. Soft keyword boosts are enough for classification.",
    enabled: true,
  },
  {
    key: "eia_energy",
    name: "U.S. EIA",
    description: "Official energy data and market updates relevant to energy disruption narratives.",
    homepageUrl: "https://www.eia.gov/",
    baseUrl: "https://www.eia.gov/",
    kind: "official_dataset",
    access: "free",
    reliability: "high",
    priority: "P1",
    ingestMethod: "api_json",
    updateCadence: "weekly",
    dimensions: ["energy_shipping"],
    implementationNotes:
      "Prefer structured reports and feeds over editorial pages when building adapters.",
    enabled: true,
  },
  {
    key: "un_security_council",
    name: "UN Security Council",
    description: "Official UN Security Council press releases and meeting coverage.",
    homepageUrl: "https://www.un.org/securitycouncil/",
    baseUrl: "https://press.un.org/en/content/security-council",
    kind: "official_feed",
    access: "free",
    reliability: "high",
    priority: "P1",
    ingestMethod: "rss_xml",
    updateCadence: "daily",
    dimensions: ["great_power_tension", "military_conflict", "nuclear_miscalculation"],
    implementationNotes:
      "Use for multilateral escalation and formal diplomatic signals.",
    enabled: true,
  },
  {
    key: "reuters_world",
    name: "Reuters World",
    description: "Global news coverage used as high-quality enrichment and corroboration.",
    homepageUrl: "https://www.reuters.com/world/",
    baseUrl: "https://www.reuters.com/world/",
    kind: "publisher_feed",
    access: "free_limited",
    reliability: "high",
    priority: "P1",
    ingestMethod: "html_parse",
    updateCadence: "daily",
    dimensions: [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ],
    implementationNotes:
      "Use as corroboration and narrative enrichment, not as a sole authoritative source.",
    enabled: true,
  },
  {
    key: "ap_world",
    name: "AP World",
    description: "Broad world coverage used as a second media corroboration source.",
    homepageUrl: "https://apnews.com/world-news",
    baseUrl: "https://apnews.com/world-news",
    kind: "publisher_feed",
    access: "free",
    reliability: "high",
    priority: "P1",
    ingestMethod: "html_parse",
    updateCadence: "daily",
    dimensions: [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ],
    implementationNotes:
      "Use to confirm major stories and improve narrative coverage across dimensions.",
    enabled: true,
  },
];

const P2_P3_SOURCE_CONFIGS: SourceConfig[] = [
  {
    key: "gnews_api",
    name: "GNews API",
    description: "Generic news API used as a low-cost backup article source.",
    homepageUrl: "https://gnews.io/",
    baseUrl: "https://gnews.io/api/v4/",
    kind: "news_api",
    access: "free_limited",
    reliability: "medium",
    priority: "P2",
    ingestMethod: "api_json",
    updateCadence: "daily",
    dimensions: [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ],
    implementationNotes:
      "Use only as secondary enrichment because free-tier delays and quotas can increase noise.",
    enabled: true,
  },
  {
    key: "newsdata_api",
    name: "NewsData.io",
    description: "Generic news API used for broad keyword-based article discovery.",
    homepageUrl: "https://newsdata.io/",
    baseUrl: "https://newsdata.io/api/1/",
    kind: "news_api",
    access: "free_limited",
    reliability: "medium",
    priority: "P2",
    ingestMethod: "api_json",
    updateCadence: "daily",
    dimensions: [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ],
    implementationNotes:
      "Apply hard keyword filters and low-confidence defaults to control noise.",
    enabled: true,
  },
  {
    key: "thenewsapi",
    name: "TheNewsAPI",
    description: "Additional generic news API fallback for redundancy if other sources are insufficient.",
    homepageUrl: "https://www.thenewsapi.com/",
    baseUrl: "https://api.thenewsapi.com/v1/",
    kind: "news_api",
    access: "free_limited",
    reliability: "medium",
    priority: "P3",
    ingestMethod: "api_json",
    updateCadence: "daily",
    dimensions: [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ],
    implementationNotes:
      "Only implement if P0 and P1 sources do not produce enough usable candidates.",
    enabled: true,
  },
];

export const SOURCE_CONFIGS: SourceConfig[] = [
  ...P0_SOURCE_CONFIGS,
  ...P1_SOURCE_CONFIGS,
  ...P2_P3_SOURCE_CONFIGS,
];

export const PRIMARY_SOURCE_KEYS = SOURCE_CONFIGS.filter(
  (source) => source.priority === "P0" || source.priority === "P1"
).map((source) => source.key);

export const SECONDARY_SOURCE_KEYS = SOURCE_CONFIGS.filter(
  (source) => source.priority === "P2" || source.priority === "P3"
).map((source) => source.key);

export const SOURCES_BY_DIMENSION: Record<GdiDimensionKey, SourceConfig[]> = {
  military_conflict: SOURCE_CONFIGS.filter((source) =>
    source.dimensions.includes("military_conflict")
  ),
  great_power_tension: SOURCE_CONFIGS.filter((source) =>
    source.dimensions.includes("great_power_tension")
  ),
  trade_sanctions: SOURCE_CONFIGS.filter((source) =>
    source.dimensions.includes("trade_sanctions")
  ),
  energy_shipping: SOURCE_CONFIGS.filter((source) =>
    source.dimensions.includes("energy_shipping")
  ),
  nuclear_miscalculation: SOURCE_CONFIGS.filter((source) =>
    source.dimensions.includes("nuclear_miscalculation")
  ),
};

export function getSourcesForDimension(dimension: GdiDimensionKey): SourceConfig[] {
  return SOURCES_BY_DIMENSION[dimension];
}

export function getPrimarySources(): SourceConfig[] {
  return SOURCE_CONFIGS.filter((source) => PRIMARY_SOURCE_KEYS.includes(source.key));
}

export function getEnabledSources(): SourceConfig[] {
  return SOURCE_CONFIGS.filter((source) => source.enabled);
}

export function getSourceByKey(key: string): SourceConfig | undefined {
  return SOURCE_CONFIGS.find((source) => source.key === key);
}

export function getDefaultConfidenceForSource(sourceKey: string): number | undefined {
  const source = getSourceByKey(sourceKey);
  return source ? DEFAULT_CONFIDENCE_BY_KIND[source.kind] : undefined;
}
