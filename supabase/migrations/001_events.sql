create table if not exists public.event_candidates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  source_url text not null,
  occurred_at timestamptz not null,
  impact_dimension text not null check (
    impact_dimension in (
      'military_conflict',
      'great_power_tension',
      'trade_sanctions',
      'energy_shipping',
      'nuclear_miscalculation'
    )
  ),
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_candidates_status on public.event_candidates(status);
create index if not exists idx_event_candidates_occurred_at on public.event_candidates(occurred_at desc);
