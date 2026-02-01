create table if not exists staging_country_research (
  id uuid primary key default gen_random_uuid(),
  import_batch_id text not null,
  source_label text,
  country_name text,
  iso2 text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists idx_staging_country_research_batch
  on staging_country_research(import_batch_id);

create index if not exists idx_staging_country_research_iso2
  on staging_country_research(iso2);
