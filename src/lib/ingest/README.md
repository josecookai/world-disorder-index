# Ingest Sources

This directory defines the source registry and normalization primitives for the Global Disorder Index.

## What this layer does

The ingest layer pulls external source material into normalized `CandidateEvent` objects that can be:

- previewed through the internal route `/api/gdi/ingest-preview`
- executed on a schedule through `/api/internal/ingest/scheduled`
- reviewed in the admin review workflow
- promoted into reviewed and published drafts through the admin flow

The ingest layer is intentionally fail-soft:

- one source failing must not fail the whole preview run
- missing optional credentials must not crash the app
- returning an empty array is acceptable when a source is unavailable or yields no usable events

## Current preview route

Internal preview endpoint:

- `GET /api/gdi/ingest-preview`
- `GET /api/internal/ingest/scheduled`

Current response shape:

```json
{
  "count": 3,
  "candidates": [
    {
      "source": "OFAC",
      "sourceKey": "ofac_sdn",
      "impactDimension": "trade_sanctions",
      "title": "OFAC SDN update: Example Entity",
      "occurredAt": "2026-03-25T00:00:00.000Z",
      "confidence": 0.9
    }
  ],
  "diagnostics": [
    {
      "sourceKey": "gdelt_events",
      "ok": true,
      "candidateCount": 2,
      "durationMs": 841
    },
    {
      "sourceKey": "iaea_news",
      "ok": false,
      "candidateCount": 0,
      "durationMs": 12015,
      "error": "Request failed with 403 Forbidden"
    }
  ]
}
```

Use this route to answer:

- which sources responded
- which sources failed
- how many candidates each source produced
- what survived dedupe and confidence filtering

## Source roles

- P0 and P1 sources are the primary foundation for ingestion.
- P2 and P3 sources are enrichment-only backups when structured coverage is insufficient.

## Authoritative sources

- `gdelt_events`: global event discovery backbone
- `acled`: structured conflict event source
- `opensanctions`: open sanctions/entity dataset
- `ofac_sdn`: official sanctions dataset
- `iaea_news`: official nuclear source
- `wto_news`: official trade policy source
- `eia_energy`: official energy data source
- `un_security_council`: official diplomatic escalation source

## Enrichment sources

- `reuters_world`
- `ap_world`
- `gnews_api`
- `newsdata_api`
- `thenewsapi`

These should never become the sole authoritative basis for a dimension score.

## Credential expectations

- `acled` requires registration and credentials
- `gnews_api`, `newsdata_api`, and `thenewsapi` are optional API-key-backed sources
- The other P0 official and open sources should remain usable without application secrets

### Environment variables

Required for current production-quality coverage:

- `ACLED_API_KEY`
- `ACLED_EMAIL`

Optional, only needed when those adapters are later enabled:

- `GNEWS_API_KEY`
- `NEWSDATA_API_KEY`
- `THENEWSAPI_TOKEN`

Other runtime variables used elsewhere in the app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase variables are not required to run ingest preview, but they are required for the publish workflow.

## Precision expectations

- `iaea_news` and `un_security_council` are expected to be low-volume but high-confidence
- `gdelt_events` is expected to be high-volume and requires stronger downstream filtering
- generic news APIs are noisy and should use stricter keyword gates and lower confidence defaults

## Threshold calibration notes

Current thresholds were reviewed against live preview behavior on `2026-03-25`.

Observed preview sample from that run:

- final retained candidates: `38`
- dominant retained sources: `ofac_sdn` (`16`), `wto_news` (`10`), `un_security_council` (`9`), `eia_energy` (`3`)
- empty/noisy/unavailable on that run: `gdelt_events` (`0`, upstream timeout), `iaea_news` (`0`, upstream `403`), `opensanctions` (`0`, timeout), `acled` (`0`, no local credentials)

This matters because the calibrations are trying to solve two opposite failure modes:

- false positives: broad text/news sources can flood preview with plausible but weak keyword matches
- false negatives: official and structured sources can be sparse or intermittently unavailable, so when they do return usable candidates they should survive normalization

Final threshold policy:

- `structured = 0.70`
  Reason: structured datasets and event APIs already arrive partially normalized, so the floor can be lower without admitting much narrative noise.
  False positives addressed: blocks weak machine-readable rows that were assigned overly generous defaults.
  False negatives accepted: still lets OFAC/OpenSanctions/ACLED-style records through when they are the best available signal.
- `official = 0.78`
  Reason: official feeds are high-trust on publisher identity but still text-derived and title-sensitive, so they need a slightly tighter floor than structured data.
  False positives addressed: filters low-information official headlines that happen to match one keyword.
  False negatives accepted: preserves WTO/EIA/IAEA/UNSC items once they have a clear dimension match.
- `media = 0.85`
  Reason: media is the noisiest path and is intended as corroboration, not the primary basis for scoring.
  False positives addressed: suppresses generic article chatter from keyword-only matches.
  False negatives accepted: media-only stories may be dropped unless they are unusually strong, which is intentional.

These values are intentionally simple. They are not meant to express probability; they are just hard floors for keeping the candidate set reviewable.

## Precedence calibration notes

Final precedence chain:

1. evidence type
2. source priority
3. confidence
4. recency

Tradeoff rationale:

- evidence type first:
  structured beats official, official beats media
  Purpose: when duplicate narratives exist, keep the more normalized or authoritative representation rather than the louder one.
- source priority second:
  P0/P1 authoritative sources beat enrichment sources even if the latter have slightly higher confidence
  Purpose: avoid a high-confidence backup source displacing the intended foundation source.
- confidence third:
  once evidence tier and source class are equal, keep the stronger match
  Purpose: within the same source class, confidence is the simplest proxy for usefulness.
- recency fourth:
  freshness breaks ties, but only after source trust and match quality
  Purpose: newer should not automatically beat better.

Observed dedupe implications from the same review:

- OFAC CSV rows now receive row-specific `sourceUrl` fragments so the `sourceUrl` conflict key no longer collapses the whole export into a single candidate
- keeping recency last prevents a newer but weaker official item from displacing an older, better-matched official item
- keeping media last in evidence precedence prevents broad discovery/news layers from outranking official or structured copies of the same event

## External fetch cache policy

Caching is opt-in per source and only stores successful upstream responses.

- `gdelt_events`: 15 minutes
- `iaea_news`: 30 minutes
- `acled`: 6 hours
- `ofac_sdn`: 6 hours
- `opensanctions`: 6 hours

Rules:

- cache is bypassed unless an adapter explicitly passes a TTL into `fetchText` or `fetchJson`
- stale cache entries are never used to mask upstream failures
- upstream fetches still use `cache: "no-store"`; the application-managed cache is the only cache layer
- preview diagnostics now surface cache status when a source used the shared HTTP helper

## Source behavior and failure modes

### `gdelt_events`

- Purpose: broad event discovery backbone
- Strength: high volume and broad topical coverage
- Known failure mode: timeouts or intermittent upstream instability
- Degraded behavior: returns empty array, diagnostics mark source as failed

### `acled`

- Purpose: high-quality conflict and escalation data
- Strength: strongest structured input for `military_conflict`
- Known failure mode: missing credentials or API/auth errors
- Degraded behavior: returns empty array when env vars are missing or request fails

### `opensanctions`

- Purpose: sanctions and entity-risk monitoring
- Strength: structured sanctions-related data with stable machine-readable export
- Known failure mode: upstream schema drift or fetch failure
- Degraded behavior: returns empty array and preserves overall ingest run

### `ofac_sdn`

- Purpose: official sanctions dataset
- Strength: authoritative sanctions signal
- Known failure mode: endpoint slowness or export changes
- Degraded behavior: returns empty array and preserves overall ingest run

### `iaea_news`

- Purpose: official nuclear risk and safeguards updates
- Strength: low-noise, high-confidence nuclear signal
- Known failure mode: upstream feed blocking or `403`
- Degraded behavior: returns empty array and emits diagnostic error

## Local debugging workflow

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

At minimum, set ACLED credentials if you want that source active.

```bash
export ACLED_API_KEY=your_key
export ACLED_EMAIL=your_email
```

### 3. Start the app

```bash
npm run dev
```

### 4. Inspect the preview route

Open:

- `http://localhost:3000/api/gdi/ingest-preview`

Check:

- `count`
- `candidates`
- `diagnostics`

### 5. Validate code health

```bash
npm run lint
npx tsc --noEmit
npm test
```

## Interpretation rules

- `count` is the number of candidates that survived dedupe and confidence filtering
- `candidateCount` inside `diagnostics` is the raw count returned by each adapter before final aggregate filtering
- `ok: false` means that source failed at runtime, but the overall run still succeeded
- an empty `candidates` array is not necessarily a bug; it may indicate no qualifying events passed the thresholds

## Scheduled execution

The scheduled entrypoint is:

- `GET /api/internal/ingest/scheduled`

Authentication:

- set `CRON_SECRET` for Vercel cron, or `INGEST_SCHEDULE_SECRET` for local fallback
- send it as `Authorization: Bearer <secret>` or `x-ingest-schedule-secret`

Operational model:

- the route runs the same fail-soft ingest pipeline used by preview
- adapter-level failures are captured in `diagnostics`
- one failed source does not crash the full scheduled run
- the latest run summary is written to `data/gdi-ingest-run.json`
- the server also logs a `[scheduled-ingest]` line for each run

Deployment:

- this repository includes a `vercel.json` cron that triggers the route hourly

Local operation:

- start the app with `npm run dev`
- set `INGEST_SCHEDULE_SECRET`
- invoke the route manually or from `cron`

Example:

```bash
curl http://localhost:3000/api/internal/ingest/scheduled \
  -H "Authorization: Bearer $CRON_SECRET"
```
