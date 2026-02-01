-- Enable gen_random_uuid()
create extension if not exists pgcrypto;

-- COUNTRIES
create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iso2 text not null unique,
  regions text[] not null default '{}',
  languages text[] not null default '{}',
  currency text,
  timezones text[] not null default '{}',
  climate_tags text[] not null default '{}',

  healthcare_overview text,
  rights_snapshot text,
  tax_snapshot text,

  lgbtq_rights_index int not null default 0,
  abortion_access_status text,
  hate_crime_law_snapshot text,

  last_verified_at timestamptz,
  status text not null default 'draft'
);

create index if not exists idx_countries_status on countries(status);
create index if not exists idx_countries_regions on countries using gin(regions);
create index if not exists idx_countries_languages on countries using gin(languages);
create index if not exists idx_countries_climate_tags on countries using gin(climate_tags);

-- VISA PATHS
create table if not exists visa_paths (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,

  name text not null,
  type text not null,
  description text,

  eligibility jsonb not null default '[]'::jsonb,
  work_rights text,
  dependents_rules text,

  min_income_amount numeric,
  min_income_currency text,

  fees jsonb not null default '[]'::jsonb,
  processing_min_days int,
  processing_max_days int,

  renewal_rules text,
  to_pr_citizenship_timeline text,
  in_country_conversion_path text,

  last_verified_at timestamptz,
  status text not null default 'draft',

  unique (country_id, name)
);

create index if not exists idx_visa_paths_country on visa_paths(country_id);
create index if not exists idx_visa_paths_status on visa_paths(status);
create index if not exists idx_visa_paths_type on visa_paths(type);
