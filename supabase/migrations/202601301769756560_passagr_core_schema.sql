-- Passagr core schema (converted from node-pg-migrate JS)
-- Assumes pgcrypto is available for gen_random_uuid().

-- If your project does not already have pgcrypto enabled:
-- create extension if not exists pgcrypto;

create table countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  iso2 char(2) unique,
  regions text[] not null default '{}',
  languages text[] not null default '{}',
  currency char(3),
  timezones text[] not null default '{}',
  climate_tags text[] not null default '{}',
  healthcare_overview text,
  rights_snapshot text,
  tax_snapshot text,
  last_verified_at timestamptz,
  last_published_at timestamptz,
  status text not null default 'draft',
  changelog_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table visa_paths (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  name text not null,
  type text not null,
  description text,
  eligibility jsonb not null default '[]'::jsonb,
  work_rights text,
  dependents_rules text,
  min_income_amount decimal(10, 2),
  min_income_currency char(3),
  min_savings_amount decimal(10, 2),
  min_savings_currency char(3),
  fees jsonb not null default '[]'::jsonb,
  processing_min_days int,
  processing_max_days int,
  renewal_rules text,
  to_pr_citizenship_timeline text,
  last_verified_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (country_id, name)
);

create table requirements (
  id uuid primary key default gen_random_uuid(),
  visapath_id uuid not null references visa_paths(id) on delete cascade,
  label text not null,
  details text,
  doc_list text[] not null default '{}',
  notarization_needed boolean not null default false,
  apostille_needed boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (visapath_id, label)
);

create table steps (
  id uuid primary key default gen_random_uuid(),
  visapath_id uuid not null references visa_paths(id) on delete cascade,
  order_int int not null,
  title text not null,
  instructions text,
  expected_duration_days int,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (visapath_id, order_int)
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  publisher text,
  content_type text,
  excerpt text,
  fetched_at timestamptz not null,
  last_checked_at timestamptz,
  reliability_score int not null default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table cost_items (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  country_id uuid references countries(id) on delete set null,
  visapath_id uuid references visa_paths(id) on delete set null,
  label text not null,
  amount decimal(10, 2) not null,
  currency char(3) not null,
  frequency text,
  source_id uuid not null references sources(id),
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  name text not null,
  tiers text[] not null default '{}',
  cost_of_living_index decimal(5, 2),
  rent_index decimal(5, 2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (country_id, name)
);

create table changelogs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  change_type text not null,
  diff_summary text not null,
  diff_fields jsonb,
  created_at timestamptz default now(),
  created_by text not null,
  source_ids uuid[] not null default '{}'
);

create table freshness_policies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  ttl_days int not null,
  criticality text not null
);

create table editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'pending',
  notes text,
  reviewer_uid text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index idx_visa_path_country_id on visa_paths(country_id);
create index idx_requirements_visapath_id on requirements(visapath_id);
create index idx_steps_visapath_id on steps(visapath_id);
create index idx_cost_items_visapath_id on cost_items(visapath_id);
create index idx_cost_items_country_id on cost_items(country_id);
create index idx_sources_url on sources(url);
create index idx_cities_country_id on cities(country_id);
create index idx_changelogs_entity on changelogs(entity_type, entity_id);
create index idx_editorial_reviews_entity on editorial_reviews(entity_type, entity_id);

insert into freshness_policies (key, ttl_days, criticality) values
  ('fees', 60, 'high'),
  ('processing_times', 60, 'high'),
  ('eligibility', 90, 'high'),
  ('steps', 120, 'medium'),
  ('tax_snapshot', 180, 'high'),
  ('rights_snapshot', 365, 'medium'),
  ('healthcare_overview', 365, 'medium');

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_countries_updated_at
before update on countries
for each row execute function update_updated_at_column();

create trigger update_visa_paths_updated_at
before update on visa_paths
for each row execute function update_updated_at_column();

create trigger update_requirements_updated_at
before update on requirements
for each row execute function update_updated_at_column();

create trigger update_steps_updated_at
before update on steps
for each row execute function update_updated_at_column();

create trigger update_cost_items_updated_at
before update on cost_items
for each row execute function update_updated_at_column();

create trigger update_sources_updated_at
before update on sources
for each row execute function update_updated_at_column();

create trigger update_cities_updated_at
before update on cities
for each row execute function update_updated_at_column();
