# Source Strategy Plan for World Disorder Index

## Summary

This plan defines a decision-complete source and ingestion strategy for the current app in `/Users/bowenwang/Documents/Vibe Coding /世界完蛋了`, aligned to the existing internal dimensions:

- `military_conflict`
- `great_power_tension`
- `trade_sanctions`
- `energy_shipping`
- `nuclear_miscalculation`

The goal is to replace the current placeholder source list in [src/lib/ingest/sources.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/sources.ts) with a production-oriented registry that prefers free or low-friction sources, uses official/structured data wherever possible, and only uses generic news APIs as secondary enrichment.

This plan does not change the public dashboard contract yet. It adds a source registry, ingestion metadata types, source-to-dimension mapping, and a staged rollout path so Cursor can implement it without making further product decisions.

## Current State

The current repo already has:

- A stable internal dimension model in [src/lib/types.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/types.ts)
- Candidate event normalization and dedupe in [src/lib/ingest/normalize.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/normalize.ts)
- A minimal source placeholder in [src/lib/ingest/sources.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/sources.ts)
- API consumers that currently read published records only, via [src/lib/api/data.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/api/data.ts) and [src/app/api/gdi/drivers/route.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/app/api/gdi/drivers/route.ts)

There is no structured source taxonomy yet, no source capability metadata, and no implementation distinction between official data, event databases, RSS feeds, and generic news APIs.

## Product Goal

Build a source layer that can support these user-facing sections on the homepage:

- Military Risk
- Geopolitical
- Trade and Energy
- Nuclear Watch

The source layer must support two downstream jobs:

1. Generate reliable candidate events for review and scoring
2. Explain which sources are contributing to each dimension

## Success Criteria

Implementation should be considered complete when all of the following are true:

- The repo contains a structured source registry with at least 10 approved sources
- Every source is mapped to at least one existing internal dimension key
- Every source includes acquisition method, cost tier, reliability, update cadence, and implementation priority
- The plan distinguishes primary structured sources from secondary generic news sources
- Cursor can implement the registry without needing to choose source names, field names, or mapping rules
- The final registry supports immediate MVP ingestion for at least:
  - `military_conflict`
  - `great_power_tension`
  - `trade_sanctions`
  - `energy_shipping`
  - `nuclear_miscalculation`

## Chosen Defaults and Assumptions

These assumptions are locked in for implementation:

- Keep existing internal dimension keys unchanged
- Prefer official or structured datasets over generic article search APIs
- Treat generic news APIs as enrichment, not as the authoritative base layer
- Prioritize sources that are free to start, publicly documented, or GitHub-accessible
- Do not add paid-only sources in the initial registry
- Do not implement scoring logic changes in this phase
- Do not alter the existing public API response shapes in this phase
- Do not create a user-facing “sources” page in this phase
- Next.js version is `16.2.1`; implementation should stay within current app-router conventions and avoid speculative framework changes

## Source Selection

### Tier 1: Primary structured sources

These are the default authoritative sources for MVP.

| Key | Name | Type | Dimensions | Why selected | Priority |
|---|---|---|---|---|---|
| `gdelt_events` | GDELT Events/Docs | event database | `military_conflict`, `great_power_tension`, `trade_sanctions`, `energy_shipping`, `nuclear_miscalculation` | Free, global, frequent updates, strong event discovery backbone | P0 |
| `acled` | ACLED API | conflict event API | `military_conflict`, `great_power_tension` | Best structured conflict and violence signal | P0 |
| `opensanctions` | OpenSanctions | GitHub/open dataset | `trade_sanctions`, `great_power_tension` | Open sanctions/entity data, easy diffing | P0 |
| `ofac_sdn` | OFAC Sanctions data | official structured data | `trade_sanctions` | Official US sanctions signal | P0 |
| `iaea_news` | IAEA News/RSS | official feed | `nuclear_miscalculation` | Official nuclear incident and safeguards signal | P0 |
| `wto_news` | WTO News/RSS | official feed | `trade_sanctions`, `energy_shipping` | Trade disputes and trade rule changes | P1 |
| `eia_energy` | U.S. EIA feeds/data | official energy data | `energy_shipping` | Hard data for energy disruption narratives | P1 |
| `un_security_council` | UN Security Council releases | official feed | `great_power_tension`, `military_conflict`, `nuclear_miscalculation` | Diplomatic escalation and formal multilateral signal | P1 |

### Tier 2: Secondary media sources

These are allowed as corroboration and narrative enrichment.

| Key | Name | Type | Dimensions | Why selected | Priority |
|---|---|---|---|---|---|
| `reuters_world` | Reuters World | publisher feed/page | all except direct score authority | High editorial quality, broad world coverage | P1 |
| `ap_world` | AP World | publisher feed/page | all except direct score authority | Broad free-access world reporting | P1 |
| `gnews_api` | GNews API | generic news API | all | Free tier available, easy backup article fetch | P2 |
| `newsdata_api` | NewsData.io | generic news API | all | Free tier available, broad keyword search | P2 |
| `thenewsapi` | TheNewsAPI | generic news API | all | Additional fallback if needed | P3 |

### Explicitly excluded from MVP

These are intentionally not part of the first implementation:

- `mediastack`
  - Excluded due to lower confidence in free-plan utility and no clear advantage over other generic APIs
- `X/Twitter API`
  - Excluded due to cost/instability and poor fit for a clean MVP
- `Financial Times`
  - Excluded from ingestion due to access/paywall friction
- Custom scraping of arbitrary publishers
  - Excluded to reduce maintenance and compliance risk

## Source-to-Dimension Mapping

This mapping is fixed for implementation.

### `military_conflict`

Primary:
- `gdelt_events`
- `acled`
- `un_security_council`

Secondary:
- `reuters_world`
- `ap_world`
- `gnews_api`
- `newsdata_api`

Keyword families:
- war
- strike
- offensive
- ceasefire collapse
- troop buildup
- missile attack
- drone attack
- artillery
- incursion
- clashes

### `great_power_tension`

Primary:
- `gdelt_events`
- `acled`
- `opensanctions`
- `un_security_council`

Secondary:
- `reuters_world`
- `ap_world`
- `gnews_api`
- `newsdata_api`

Keyword families:
- sanctions
- expulsion
- military drills
- diplomatic protest
- naval standoff
- export control
- alliance warning
- strategic rivalry
- cyber attribution
- summit breakdown

### `trade_sanctions`

Primary:
- `opensanctions`
- `ofac_sdn`
- `wto_news`
- `gdelt_events`

Secondary:
- `reuters_world`
- `ap_world`
- `gnews_api`
- `newsdata_api`

Keyword families:
- tariff
- sanctions package
- export ban
- import restriction
- entity list
- price cap
- customs duty
- embargo
- retaliation
- trade dispute

### `energy_shipping`

Primary:
- `eia_energy`
- `wto_news`
- `gdelt_events`

Secondary:
- `reuters_world`
- `ap_world`
- `gnews_api`
- `newsdata_api`

Keyword families:
- shipping disruption
- tanker
- strait closure
- pipeline
- LNG
- crude exports
- insurance premium
- port shutdown
- freight
- rerouting

### `nuclear_miscalculation`

Primary:
- `iaea_news`
- `un_security_council`
- `gdelt_events`

Secondary:
- `reuters_world`
- `ap_world`
- `gnews_api`
- `newsdata_api`

Keyword families:
- nuclear warning
- strategic forces
- uranium enrichment
- reactor incident
- safeguards
- missile test
- launch detection
- deterrence
- miscalculation
- radiological event

## Required Type and Interface Changes

The current `SourceConfig` type in [src/lib/ingest/sources.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/sources.ts) is too small. Replace it with the following model.

### New source type model

```ts
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
  updateCadence: "near_real_time" | "hourly" | "daily" | "weekly" | "irregular";
  dimensions: GdiDimensionKey[];
  keywords?: string[];
  regions?: string[];
  implementationNotes: string;
  enabled: boolean;
};
```

### Required exported constants

The module must export all of the following:

```ts
export const SOURCE_CONFIGS: SourceConfig[];
export const SOURCES_BY_DIMENSION: Record<GdiDimensionKey, SourceConfig[]>;
export const PRIMARY_SOURCE_KEYS: string[];
export const SECONDARY_SOURCE_KEYS: string[];
```

## Concrete Registry Entries

Cursor should implement these exact entries first.

### P0 entries

```ts
[
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
    implementationNotes: "Use as discovery backbone; downstream filters should apply dimension-specific keyword rules.",
    enabled: true,
  },
  {
    key: "acled",
    name: "ACLED",
    description: "Structured conflict event data for war, violence, and escalation tracking.",
    homepageUrl: "https://acleddata.com/",
    baseUrl: "https://acleddata.com/api-documentation/",
    kind: "event_api",
    access: "free_with_registration",
    reliability: "high",
    priority: "P0",
    ingestMethod: "api_json",
    updateCadence: "daily",
    dimensions: ["military_conflict", "great_power_tension"],
    keywords: [],
    implementationNotes: "Prefer direct event categories instead of keyword-only classification.",
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
    implementationNotes: "Use dataset diffs or latest export snapshots to track sanctions additions and removals.",
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
    implementationNotes: "Treat as authoritative structured sanctions source; ingest as a delta-aware dataset.",
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
    implementationNotes: "Use for nuclear-related official updates; low volume but high precision.",
    enabled: true,
  },
]
```

### P1 entries

Implement next:

- `wto_news`
- `eia_energy`
- `un_security_council`
- `reuters_world`
- `ap_world`

### P2 entries

Implement only if P0/P1 do not generate enough candidates:

- `gnews_api`
- `newsdata_api`

### P3 entries

Implement only if additional redundancy is needed:

- `thenewsapi`

## File-Level Implementation Plan

### 1. Replace the placeholder source registry

Update [src/lib/ingest/sources.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/sources.ts) to become the canonical registry.

It must contain:

- The new type definitions
- The exact source entries above
- Dimension-indexed lookup maps
- Helper selectors:
  - `getSourcesForDimension(dimension: GdiDimensionKey): SourceConfig[]`
  - `getPrimarySources(): SourceConfig[]`
  - `getEnabledSources(): SourceConfig[]`

### 2. Add source-aware event type support

Create a new module:

- [src/lib/ingest/events.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/events.ts)

This file should define:

```ts
import type { GdiDimensionKey } from "@/lib/types";

export type CandidateEvent = {
  title: string;
  sourceKey: string;
  source: string;
  sourceUrl: string;
  occurredAt: string;
  impactDimension: GdiDimensionKey;
  confidence: number;
  evidenceType: "structured" | "official" | "media";
  rawCategory?: string;
  rawRegion?: string;
};
```

Then update [src/lib/ingest/normalize.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/normalize.ts) to import this shared type instead of owning the event shape locally.

### 3. Add per-dimension keyword presets

Create:

- [src/lib/ingest/keywords.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/keywords.ts)

Export:

```ts
export const DIMENSION_KEYWORDS: Record<GdiDimensionKey, string[]>;
```

The exact keyword families should match the mapping section above.

Rule:
- Structured sources like ACLED and OFAC do not require keyword filtering as the primary classifier
- GDELT and generic news APIs do require keyword filtering
- Official feeds like IAEA and WTO may use soft keyword boosting, not hard exclusion, unless volume becomes too noisy

### 4. Add source capability documentation in code

Create:

- [src/lib/ingest/README.md](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/README.md)

This file should document:

- Why each source exists
- Which dimensions it feeds
- Whether it is authoritative or enrichment only
- Which sources require credentials or registration
- Which sources are expected to have low volume but high confidence

### 5. Keep API layer unchanged in this phase

Do not modify:

- [src/app/api/gdi/latest/route.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/app/api/gdi/latest/route.ts)
- [src/app/api/gdi/history/route.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/app/api/gdi/history/route.ts)
- [src/app/api/gdi/drivers/route.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/app/api/gdi/drivers/route.ts)

Reason:
- This phase only prepares ingestion/source truth
- The published-record API contract should stay stable while source plumbing is introduced behind it

## Normalization and Selection Rules

These rules are fixed for implementation.

### Deduplication

Current dedupe in [src/lib/ingest/normalize.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/ingest/normalize.ts) uses `normalized title + source`.

Update behavior to support this order of preference:

1. `sourceUrl` exact match
2. `normalized title + sourceKey`
3. `normalized title + source`

Reason:
- Multiple official feeds may share similar article titles
- `sourceKey` is more stable than human-readable source name

### Confidence defaults

These defaults should be applied when a source adapter does not provide an explicit confidence:

- `official_dataset`: `0.9`
- `event_api`: `0.85`
- `official_feed`: `0.8`
- `github_dataset`: `0.75`
- `publisher_feed`: `0.7`
- `news_api`: `0.6`

### Minimum confidence threshold

Use these thresholds by evidence type:

- `structured`: `0.7`
- `official`: `0.7`
- `media`: `0.6`

### Source precedence

When the same event appears from multiple sources, prefer in this order:

1. Official dataset
2. Event API
3. Official feed
4. GitHub dataset
5. Publisher feed
6. Generic news API

## Rollout Phases

### Phase 1: Registry foundation

Deliverables:
- Expand `sources.ts`
- Add `keywords.ts`
- Add `events.ts`
- Refactor `normalize.ts` to shared types

Acceptance:
- Typecheck passes
- Existing API routes remain unchanged
- Registry exports are complete and usable

### Phase 2: Adapter stubs

Create adapter placeholders, without full network logic yet:

- `src/lib/ingest/adapters/gdelt.ts`
- `src/lib/ingest/adapters/acled.ts`
- `src/lib/ingest/adapters/opensanctions.ts`
- `src/lib/ingest/adapters/ofac.ts`
- `src/lib/ingest/adapters/iaea.ts`

Each stub must expose:

```ts
export async function fetchCandidates(): Promise<CandidateEvent[]>
```

Acceptance:
- No adapter writes to DB yet
- All adapters compile
- At least one mock event fixture per adapter exists for local validation

### Phase 3: Real ingestion

Implement live fetch logic in P0 adapters.

Rules:
- No source should block the whole run if it fails
- Each adapter should return an empty array on recoverable errors
- Log errors with source key context
- Respect registration-gated sources by requiring env vars where applicable

Suggested env vars:
- `ACLED_API_KEY`
- `ACLED_EMAIL`
- `GNEWS_API_KEY`
- `NEWSDATA_API_KEY`
- `THENEWSAPI_TOKEN`

Acceptance:
- P0 adapters can fetch and normalize data independently
- Missing optional API keys do not crash the app

### Phase 4: Review workflow integration

Once ingestion works, use candidate events to feed the admin review workflow.

This phase is out of scope for this plan’s code changes, but the design must preserve compatibility with:
- `drivers`
- `summary`
- future scoring pipelines

## Testing Plan

### Unit tests

Add tests for:

- `SOURCES_BY_DIMENSION` contains correct source keys per dimension
- `getPrimarySources()` returns only `P0` and `P1` authoritative sources if implemented that way, or only `P0` if chosen; choose one and document it
- `DIMENSION_KEYWORDS` includes all required keyword groups
- confidence default assignment per `SourceKind`
- source precedence ordering
- dedupe using `sourceUrl` before title-based fallback

### Fixture tests

Create fixtures for:

- one ACLED conflict event
- one GDELT event row mapped to `great_power_tension`
- one OFAC sanctions update mapped to `trade_sanctions`
- one IAEA news item mapped to `nuclear_miscalculation`

### Integration tests

Add a non-network integration layer that verifies:

- multiple adapters can return candidate arrays and merge cleanly
- duplicate stories from Reuters and GNews collapse to one event
- official data survives dedupe when duplicated by a media source
- missing env vars for optional APIs do not throw

## Acceptance Scenarios

Implementation is accepted if these scenarios work:

1. Calling `getSourcesForDimension("military_conflict")` returns `gdelt_events`, `acled`, `un_security_council`, and relevant secondary sources.
2. Calling `getSourcesForDimension("nuclear_miscalculation")` returns `iaea_news` as a primary source.
3. A duplicate Reuters and GNews article about the same sanctions package is collapsed to one candidate.
4. An OFAC dataset change is classified into `trade_sanctions` without keyword matching.
5. A GDELT event containing “missile test” maps to `nuclear_miscalculation` when keywords match.
6. If `GNEWS_API_KEY` is absent, the generic news adapter is skipped without failing the ingest cycle.
7. Existing dashboard API responses remain unchanged.

## Risks and Mitigations

### Risk: generic news APIs produce noisy results
Mitigation:
- Use them only as P2/P3 enrichment
- Require keyword match and lower confidence defaults
- Never make them the only source for a dimension

### Risk: official feeds have low event volume
Mitigation:
- Pair official feeds with GDELT for discovery
- Preserve source precedence so official sources upgrade confidence when present

### Risk: registration-gated APIs create onboarding friction
Mitigation:
- Keep GDELT, OFAC, OpenSanctions, IAEA available with no key
- Make ACLED optional but strongly recommended

### Risk: source pages or feed endpoints change
Mitigation:
- Keep registry metadata separate from adapter logic
- Add `implementationNotes` field for maintenance context

## Out of Scope

The following are not part of this plan:

- Reworking the scoring model in [src/lib/scoring/engine.ts](/Users/bowenwang/Documents/Vibe%20Coding%20/%E4%B8%96%E7%95%8C%E5%AE%8C%E8%9B%8B%E4%BA%86/src/lib/scoring/engine.ts)
- Modifying Supabase schema
- Adding cron jobs or deployment automation
- Adding a public-facing source transparency UI
- Building alerting, ranking, or LLM summarization logic

## Implementation Notes for Cursor

Cursor should implement in this exact order:

1. Replace the source registry and types in `src/lib/ingest/sources.ts`
2. Add shared event types in `src/lib/ingest/events.ts`
3. Refactor `src/lib/ingest/normalize.ts` to use the shared type and improved dedupe
4. Add `src/lib/ingest/keywords.ts`
5. Add adapter stubs for P0 sources
6. Add tests and fixtures
7. Only after those steps, wire live network fetches

Cursor should not:
- rename dimension keys
- change current dashboard APIs
- introduce paid-only providers
- rely on FT or arbitrary scraping for MVP
