# Ingest Sources

This directory defines the source registry and normalization primitives for the Global Disorder Index.

## What this layer does

The ingest layer pulls external source material into normalized `CandidateEvent` objects that can be:

- previewed through the internal route `/api/gdi/ingest-preview`
- reviewed in the admin review workflow
- promoted into reviewed and published drafts through the admin flow

The ingest layer is intentionally fail-soft:

- one source failing must not fail the whole preview run
- missing optional credentials must not crash the app
- returning an empty array is acceptable when a source is unavailable or yields no usable events

## Current preview route

Internal preview endpoint:

- `GET /api/gdi/ingest-preview`

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
