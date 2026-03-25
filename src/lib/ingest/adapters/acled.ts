import { buildCandidateEvent } from "@/lib/ingest/classify";
import type { CandidateEvent } from "@/lib/ingest/events";
import { fetchJson } from "@/lib/ingest/http";

type AcledEvent = {
  event_id_cnty?: string;
  event_date?: string;
  country?: string;
  admin1?: string;
  location?: string;
  disorder_type?: string;
  event_type?: string;
  sub_event_type?: string;
  actor1?: string;
  actor2?: string;
  assoc_actor_1?: string;
  assoc_actor_2?: string;
  fatalities?: number | string;
  notes?: string;
};

type AcledResponse = {
  success?: boolean;
  data?: AcledEvent[];
};

const ACLED_API_URL = "https://api.acleddata.com/acled/read";
const LOOKBACK_DAYS = 21;
const MAX_RECORDS = 100;
const MAJOR_POWER_KEYWORDS = [
  "united states",
  "u.s.",
  "us forces",
  "usa",
  "china",
  "chinese",
  "russia",
  "russian",
  "nato",
  "taiwan",
  "european union",
  "eu",
  "united kingdom",
  "uk",
] as const;
const HIGH_TENSION_SUBEVENTS = [
  "strategic developments",
  "agreement",
  "arrests",
  "mob violence",
] as const;
const MILITARY_EVENT_TYPES = [
  "battles",
  "explosions/remote violence",
  "violence against civilians",
] as const;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildUrl(email: string, apiKey: string): string {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - LOOKBACK_DAYS);

  const params = new URLSearchParams({
    key: apiKey,
    email,
    terms: "accept",
    limit: String(MAX_RECORDS),
    event_date: `${formatDate(startDate)}|${formatDate(endDate)}`,
    event_date_where: "BETWEEN",
  });

  return `${ACLED_API_URL}?${params.toString()}`;
}

function toIsoDate(value?: string): string {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function toRegion(event: AcledEvent): string | undefined {
  return [event.country, event.admin1, event.location].filter(Boolean).join(" / ") || undefined;
}

function normalizeText(...parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();
}

function parseFatalities(value?: number | string): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isMilitaryConflict(event: AcledEvent): boolean {
  const disorderType = event.disorder_type?.toLowerCase();
  const eventType = event.event_type?.toLowerCase();

  return (
    disorderType === "political violence" ||
    Boolean(eventType && MILITARY_EVENT_TYPES.includes(eventType as (typeof MILITARY_EVENT_TYPES)[number]))
  );
}

function isGreatPowerTension(event: AcledEvent): boolean {
  const haystack = normalizeText(
    event.actor1,
    event.actor2,
    event.assoc_actor_1,
    event.assoc_actor_2,
    event.notes,
    event.country,
    event.location
  );
  const subEventType = event.sub_event_type?.toLowerCase() ?? "";
  const eventType = event.event_type?.toLowerCase() ?? "";
  const mentionsMajorPower = MAJOR_POWER_KEYWORDS.some((keyword) => haystack.includes(keyword));
  const highTensionSubevent = HIGH_TENSION_SUBEVENTS.some((keyword) => subEventType.includes(keyword));

  return mentionsMajorPower && (highTensionSubevent || eventType === "strategic developments");
}

function buildTitle(event: AcledEvent, impactDimension: CandidateEvent["impactDimension"]): string {
  const country = event.country?.trim();
  const location = event.location?.trim();
  const actor1 = event.actor1?.trim();
  const actor2 = event.actor2?.trim();
  const eventType = event.event_type?.trim();
  const subEventType = event.sub_event_type?.trim();
  const fatalities = parseFatalities(event.fatalities);

  const subject =
    actor1 && actor2
      ? `${actor1} vs ${actor2}`
      : actor1 ?? actor2 ?? country ?? location ?? "ACLED event";
  const place = [location, country].filter(Boolean).join(", ");
  const scope =
    impactDimension === "great_power_tension" ? "Great-power tension" : "Military conflict";
  const detail = [eventType, subEventType].filter(Boolean).join(" / ");
  const fatalityLabel =
    typeof fatalities === "number" && fatalities > 0 ? `; ${fatalities} reported fatalities` : "";

  return [scope, subject, detail, place]
    .filter(Boolean)
    .join(": ")
    .concat(fatalityLabel);
}

function toCandidateEvent(event: AcledEvent): CandidateEvent | undefined {
  const impactDimension = isGreatPowerTension(event)
    ? "great_power_tension"
    : isMilitaryConflict(event)
      ? "military_conflict"
      : undefined;

  if (!impactDimension) return undefined;

  const sourceUrl = event.event_id_cnty
    ? `${ACLED_API_URL}?event_id_cnty=${encodeURIComponent(event.event_id_cnty)}`
    : ACLED_API_URL;

  return buildCandidateEvent("acled", {
    title: buildTitle(event, impactDimension),
    source: "ACLED",
    sourceUrl,
    occurredAt: toIsoDate(event.event_date),
    impactDimension,
    rawCategory: [event.disorder_type, event.event_type, event.sub_event_type]
      .filter(Boolean)
      .join(" / "),
    rawRegion: toRegion(event),
    confidence: impactDimension === "great_power_tension" ? 0.88 : 0.9,
  });
}

export async function fetchCandidates(): Promise<CandidateEvent[]> {
  const email = process.env.ACLED_EMAIL?.trim();
  const apiKey = process.env.ACLED_API_KEY?.trim();

  if (!email || !apiKey) {
    return [];
  }

  try {
    const data = await fetchJson<AcledResponse>(buildUrl(email, apiKey), {
      timeoutMs: 20000,
      cacheTtlMs: 6 * 60 * 60 * 1000,
      sourceKey: "acled",
    });

    if (!data.success) {
      return [];
    }

    return (data.data ?? [])
      .map((event) => toCandidateEvent(event))
      .filter((item): item is CandidateEvent => Boolean(item));
  } catch (error) {
    console.error("[ingest][acled]", error);
    return [];
  }
}
