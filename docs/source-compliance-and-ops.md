# Source Compliance and Ops Checklist

This document is a production-readiness checklist for the current and planned ingest sources.

Scope:

- operational assumptions for the current adapters
- source access and credential handling
- caching and scheduling expectations
- attribution and usage assumptions that should be reviewed before production
- explicit open questions and risks

This is not legal advice. Where the repository does not establish a fact and an official source was not verified in code review, the item is marked as an open question instead of a compliance conclusion.

## How to use this document

Use this checklist before enabling a source in a production ingest run:

1. Confirm the source is still enabled in [`src/lib/ingest/sources.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/sources.ts).
2. Confirm the adapter implementation and current fetch path in `src/lib/ingest/adapters/`.
3. Confirm credential and cache configuration in the deploy environment.
4. Confirm attribution, redistribution, and rate-limit assumptions against the source's official documentation or contract.
5. Confirm failure mode handling in diagnostics and scheduled ingest logs.

## Shared deployment assumptions

Verified from repository:

- Scheduled ingest runs through [`/api/internal/ingest/scheduled`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/app/api/internal/ingest/scheduled/route.ts), protected by `CRON_SECRET` or `INGEST_SCHEDULE_SECRET`.
- The current deployment model assumes hourly cron invocation via [`vercel.json`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/vercel.json).
- Adapter failures are fail-soft: one source failure should not crash the overall ingest run.
- HTTP caching is app-managed in [`src/lib/ingest/http.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/http.ts), only caches successful responses, and does not serve stale cache to mask upstream failures.
- Health and run-summary persistence are best-effort local JSON writes and are not a durable production audit log.

Operational implications:

- Treat local file-backed cache and diagnostics as opportunistic in serverless environments.
- Do not rely on `data/` writes as the only production observability path.
- Keep scheduled execution frequency at or below the slowest source's acceptable polling posture unless source-specific review says otherwise.

## Source checklist

## GDELT

Verified assumptions:

- Access method: unauthenticated HTTP JSON request to GDELT DOC 2 API, implemented in [`src/lib/ingest/adapters/gdelt.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/gdelt.ts).
- Current fetch path: `https://api.gdeltproject.org/api/v2/doc/doc?...`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: hourly scheduler is acceptable because the adapter cache TTL is 15 minutes and the source is marked `near_real_time`.
- Caching assumption: 15 minute local cache TTL.
- Usage assumption in code: discovery backbone only, not sole authoritative evidence for a score.
- Known failure modes in repo: timeouts, intermittent upstream instability, noisy high-volume output.

Operational deployment assumptions:

- Keep result volume capped and downstream filtering strict.
- Monitor for empty-but-successful runs separately from hard request failures.
- Prefer GDELT for discovery and corroborate with higher-confidence sources before production scoring decisions.

Open questions:

- Confirm official acceptable automated polling guidance for this exact endpoint and query volume.
- Confirm any attribution language required when GDELT-derived article metadata is shown in internal or external admin tools.

Known risks:

- High false-positive and drift risk from keyword-driven discovery.
- If GDELT quality degrades, it can still dominate candidate volume unless thresholds are tuned conservatively.

Official reference:

- [GDELT Project](https://www.gdeltproject.org/)

## ACLED

Verified assumptions:

- Access method: authenticated HTTP JSON API call, implemented in [`src/lib/ingest/adapters/acled.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/acled.ts).
- Current fetch path: `https://api.acleddata.com/acled/read`
- Credentials: `ACLED_EMAIL` and `ACLED_API_KEY` are required for coverage in this repo.
- Recommended fetch frequency in this repo: daily to hourly is operationally safe for the app because cache TTL is 6 hours and the source registry marks it `daily`.
- Caching assumption: 6 hour local cache TTL.
- Usage assumption in code: high-confidence structured conflict input; strongest source for `military_conflict`.
- Known failure modes in repo: missing credentials, auth failure, API error, empty responses.

Operational deployment assumptions:

- Treat ACLED as contract- or account-governed rather than anonymous open data.
- Validate account quotas and acceptable automated access before enabling high-frequency schedules.
- Keep credentials only on server-side scheduled/admin environments.

Open questions:

- Confirm current API usage limits and redistribution permissions for persisted candidate data.
- Confirm whether internal admin surfaces and stored excerpts require specific attribution text under the active ACLED terms.

Known risks:

- Production coverage silently degrades to zero if credentials are absent or expired.
- Contractual restrictions may be tighter than the repo's current technical assumptions.

Official references:

- [ACLED](https://acleddata.com/)
- [How can I access and use ACLED data?](https://acleddata.com/knowledge-base/how-can-i-access-and-use-acled-data/)

## IAEA

Verified assumptions:

- Access method: RSS/XML fetch, implemented in [`src/lib/ingest/adapters/iaea.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/iaea.ts).
- Current fetch path: `https://www.iaea.org/news/rss`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: hourly scheduler is acceptable because cache TTL is 30 minutes, but source volume is expected to be low.
- Caching assumption: 30 minute local cache TTL.
- Usage assumption in code: high-confidence official signal for `nuclear_miscalculation`.
- Known failure modes in repo: feed blocking, `403`, low volume.

Operational deployment assumptions:

- Expect occasional upstream anti-bot or edge blocking.
- Preserve diagnostics when the feed returns empty or inaccessible, because zero volume can be legitimate.

Open questions:

- Confirm whether IAEA expects any specific attribution when item titles are surfaced internally or exported.
- Confirm whether feed consumption has any documented automated access constraints.

Known risks:

- Low volume means source absence can look like failure.
- Feed format changes or temporary feed blocking can suppress nuclear coverage.

Official references:

- [IAEA](https://www.iaea.org/)
- [IAEA News RSS](https://www.iaea.org/news/rss)

## OFAC

Verified assumptions:

- Access method: unauthenticated CSV export fetch, implemented in [`src/lib/ingest/adapters/ofac.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/ofac.ts).
- Current fetch path: `https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: daily to hourly is operationally safe because cache TTL is 6 hours and source registry marks it `daily`.
- Caching assumption: 6 hour local cache TTL.
- Usage assumption in code: authoritative official sanctions signal.
- Known failure modes in repo: export layout change, endpoint slowness, identical export URL causing dedupe issues unless row fragments are preserved.

Operational deployment assumptions:

- Track schema drift on CSV columns because parsing is intentionally lightweight.
- Treat row-level `occurredAt` as ingestion-time, not authoritative publication timestamp, unless a better update timestamp becomes available.

Open questions:

- Confirm any official redistribution or attribution expectations for derived internal candidate records.
- Confirm whether a more stable machine-readable endpoint with explicit update metadata should replace the preview export path.

Known risks:

- Current implementation only samples the first 16 CSV rows, which is operationally simple but not complete.
- Lack of source-provided per-row timestamp weakens auditability.

Official references:

- [OFAC](https://ofac.treasury.gov/)
- [OFAC Sanctions List Service](https://sanctionslistservice.ofac.treas.gov/)

## OpenSanctions

Verified assumptions:

- Access method: unauthenticated JSON lines download, implemented in [`src/lib/ingest/adapters/opensanctions.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/opensanctions.ts).
- Current fetch path: `https://data.opensanctions.org/datasets/latest/default/targets.nested.json`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: daily to hourly is operationally safe because cache TTL is 6 hours and source registry marks it `daily`.
- Caching assumption: 6 hour local cache TTL.
- Usage assumption in code: structured sanctions/entity-risk enrichment and corroboration for sanctions-related narratives.
- Known failure modes in repo: upstream schema drift, partial parsing failures, dataset fetch failures.

Operational deployment assumptions:

- Treat `latest` dataset paths as mutable; monitor for schema and packaging changes.
- Prefer snapshot or diff strategies if this becomes a primary production sanctions dependency.

Open questions:

- Confirm attribution and redistribution requirements for persisted derived entity candidates.
- Confirm whether `targets.nested.json` is the best production endpoint versus a versioned dataset artifact.

Known risks:

- Current adapter only samples the first 30 non-empty lines, so it is not complete.
- The `latest` path can change content semantics without code changes.

Official references:

- [OpenSanctions](https://www.opensanctions.org/)
- [OpenSanctions Data](https://data.opensanctions.org/)

## WTO

Verified assumptions:

- Access method: RSS/XML fetch, implemented in [`src/lib/ingest/adapters/wto.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/wto.ts).
- Current fetch path: `https://www.wto.org/library/rss/latest_news_e.xml`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: weekly to daily is sufficient; current hourly scheduler is acceptable but more frequent than necessary.
- Caching assumption: no explicit adapter cache TTL is currently configured.
- Usage assumption in code: high-confidence official context for `trade_sanctions`, secondary support for `energy_shipping` and `great_power_tension`.
- Known failure modes in repo: RSS structure changes, missing or malformed dates, no app-managed cache currently.

Operational deployment assumptions:

- Add a source-specific cache TTL before heavy production use to reduce repeated polling.
- Because this source is low-volume, alert on sustained failure but not on a single empty run.

Open questions:

- Confirm any feed attribution requirements.
- Confirm whether hourly polling is acceptable or should be reduced to daily.

Known risks:

- No explicit cache TTL means every scheduled run will re-fetch upstream.
- Trade-policy headlines may be relevant context but not direct sanctions events.

Official references:

- [WTO News](https://www.wto.org/english/news_e/news_e.htm)
- [WTO RSS feed](https://www.wto.org/library/rss/latest_news_e.xml)

## EIA

Verified assumptions:

- Access method: RSS/XML fetch, implemented in [`src/lib/ingest/adapters/eia.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/eia.ts).
- Current fetch path: `https://www.eia.gov/rss/press_rss.xml`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: weekly to daily is sufficient; current hourly scheduler is acceptable but more frequent than necessary.
- Caching assumption: no explicit adapter cache TTL is currently configured.
- Usage assumption in code: official energy context with primary relevance to `energy_shipping`.
- Known failure modes in repo: RSS changes, sparse cadence, lack of explicit source caching.

Operational deployment assumptions:

- Add a cache TTL if this feed remains on hourly cron.
- Treat this source as contextual support, not direct evidence of market disruption by itself.

Open questions:

- Confirm whether EIA RSS feed usage has any explicit automated access or attribution language beyond ordinary public-feed use.
- Confirm whether a structured EIA API would be better for production than the current press feed.

Known risks:

- Press releases may be too sparse or too editorial for direct operational signals.
- No explicit cache TTL means unnecessary upstream requests on each scheduled run.

Official references:

- [EIA](https://www.eia.gov/)
- [EIA RSS feed](https://www.eia.gov/rss/press_rss.xml)

## UN Security Council

Verified assumptions:

- Access method: HTML page scrape, implemented in [`src/lib/ingest/adapters/un-security-council.ts`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/src/lib/ingest/adapters/un-security-council.ts).
- Current fetch path: `https://press.un.org/en/content/security-council`
- Credentials: none in current implementation.
- Recommended fetch frequency in this repo: daily to hourly is acceptable operationally, but this should be reviewed because the adapter currently scrapes HTML, not an official feed.
- Caching assumption: no explicit adapter cache TTL is currently configured.
- Usage assumption in code: official diplomatic escalation and multilateral context.
- Known failure modes in repo: HTML structure drift, parser fragility, skipped live-blog items, missing dates or links.

Operational deployment assumptions:

- This source is the most brittle current official-source adapter because it relies on page structure.
- Treat parser breakage as likely and test it with fixtures regularly.
- Prefer an official feed or API if one is available.

Open questions:

- Confirm whether a stable RSS or other machine-readable Security Council source exists and should replace HTML scraping.
- Confirm acceptable polling expectations for the press site.
- Confirm attribution expectations when headlines or summaries are surfaced internally.

Known risks:

- HTML scrape breakage can silently remove a high-confidence diplomatic source.
- No explicit cache TTL means repeated fetches on every scheduled run.

Official references:

- [UN Security Council](https://www.un.org/securitycouncil/)
- [UN Press Security Council content](https://press.un.org/en/content/security-council)

## Cross-source open questions

- Which sources permit storing and re-displaying normalized candidate titles and summaries in persistent admin tooling?
- Which sources require visible attribution in internal admin surfaces versus only in external distribution?
- Which sources have published rate-limit guidance that should directly shape cron frequency?
- Which sources should move from best-effort local cache to durable shared cache or object storage in production?

## Highest-priority known risks

- ACLED is the highest compliance risk because access is credentialed and likely governed by terms beyond what the repo enforces technically.
- UN Security Council is the highest parser fragility risk because it currently depends on HTML scraping.
- WTO and EIA are the clearest operational inefficiencies because they currently have no explicit adapter cache TTL despite hourly cron.
- OFAC and OpenSanctions are the clearest completeness risks because the current adapters intentionally sample only a subset of available records.
- File-backed cache and diagnostics are not durable production observability or audit storage.

## Recommended next hardening steps

1. Review attribution and redistribution terms for ACLED, GDELT, OpenSanctions, and OFAC with an operator who owns production compliance.
2. Add explicit cache TTLs for WTO, EIA, and UN Security Council if hourly scheduled ingest remains enabled.
3. Replace or supplement HTML scraping for UN Security Council with a stable machine-readable source if available.
4. Decide whether OFAC and OpenSanctions should remain preview-oriented samplers or become full-ingest adapters.
5. Move cache, health, and run-history persistence off local filesystem if production observability matters.
