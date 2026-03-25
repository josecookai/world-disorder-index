# Ingest Sources

This directory defines the source registry and normalization primitives for the Global Disorder Index.

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

## Precision expectations

- `iaea_news` and `un_security_council` are expected to be low-volume but high-confidence
- `gdelt_events` is expected to be high-volume and requires stronger downstream filtering
- generic news APIs are noisy and should use stricter keyword gates and lower confidence defaults
