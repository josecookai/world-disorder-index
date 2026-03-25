alter table public.event_candidates
  add column if not exists candidate_key text,
  add column if not exists source_key text,
  add column if not exists evidence_type text,
  add column if not exists raw_category text,
  add column if not exists raw_region text,
  add column if not exists reviewed_at timestamptz;

update public.event_candidates
set candidate_key = coalesce(candidate_key, id::text),
    source_key = coalesce(source_key, source),
    evidence_type = coalesce(evidence_type, 'structured')
where candidate_key is null
   or source_key is null
   or evidence_type is null;

alter table public.event_candidates
  alter column candidate_key set not null,
  alter column source_key set not null,
  alter column evidence_type set not null;

create unique index if not exists idx_event_candidates_candidate_key
  on public.event_candidates(candidate_key);
