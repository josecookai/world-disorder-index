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

Current thresholds were reviewed against live preview behavior on `2026-03-25`:

- `ofac_sdn` produced multiple valid sanctions candidates, but they were being over-merged because every row shared one export URL
- `gdelt_events` showed upstream rate limiting and remains a noisy discovery layer when it does respond
- `iaea_news` and `opensanctions` were intermittently unavailable, reinforcing the need to keep official and structured sources above the baseline floor

Threshold updates from that review:

- `structured`: `0.65 -> 0.70`
- `official`: `0.75 -> 0.78`
- `media`: unchanged at `0.85`

Precedence updates from that review:

- OFAC CSV rows now receive row-specific `sourceUrl` fragments so the global `sourceUrl` dedupe rule no longer collapses the whole export into one candidate
- the existing precedence chain remains: evidence type, then source priority, then confidence, then recency

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
