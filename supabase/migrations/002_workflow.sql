create table if not exists public.gdi_records (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  score_total int not null check (score_total >= 0 and score_total <= 100),
  label_en text not null,
  label_zh text not null,
  wow_change int not null,
  military_conflict int not null check (military_conflict >= 0 and military_conflict <= 20),
  great_power_tension int not null check (great_power_tension >= 0 and great_power_tension <= 20),
  trade_sanctions int not null check (trade_sanctions >= 0 and trade_sanctions <= 20),
  energy_shipping int not null check (energy_shipping >= 0 and energy_shipping <= 20),
  nuclear_miscalculation int not null check (nuclear_miscalculation >= 0 and nuclear_miscalculation <= 20),
  drivers jsonb not null default '[]'::jsonb,
  summary text not null,
  score_reason text,
  reviewed_by text,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gdi_records_status on public.gdi_records(status);
create index if not exists idx_gdi_records_date on public.gdi_records(date desc);
