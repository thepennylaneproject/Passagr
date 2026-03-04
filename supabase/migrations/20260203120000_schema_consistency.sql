-- Ensure core country fields and normalized lookup tables exist for UI consumption.

-- 1) Abortion access tier enum + countries columns
do $$
begin
  if not exists (select 1 from pg_type where typname = 'abortion_access_tier') then
    create type public.abortion_access_tier as enum ('protected', 'decriminalized', 'restricted');
  end if;
end $$;

alter table public.countries
  add column if not exists iso2 text,
  add column if not exists regions text[] not null default '{}',
  add column if not exists lgbtq_rights_index int not null default 0,
  add column if not exists abortion_access_status text,
  add column if not exists abortion_access_tier public.abortion_access_tier,
  add column if not exists last_verified_at timestamptz;

create unique index if not exists countries_iso2_unique
  on public.countries (iso2);

create index if not exists idx_countries_abortion_access_tier
  on public.countries (abortion_access_tier);

-- 2) Normalized list tables (languages, timezones, climate tags)
create table if not exists public.country_languages (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  language text not null,
  is_primary boolean not null default false,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.country_timezones (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  timezone text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.country_climate_tags (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  tag text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

alter table public.country_languages
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists is_primary boolean not null default false,
  add column if not exists source_id uuid,
  add column if not exists created_at timestamptz not null default now();

alter table public.country_timezones
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists source_id uuid,
  add column if not exists created_at timestamptz not null default now();

alter table public.country_climate_tags
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists source_id uuid,
  add column if not exists created_at timestamptz not null default now();

do $$
declare
  pk_name text;
  pk_cols text[];
begin
  -- country_languages primary key normalization
  select c.conname, array_agg(a.attname order by x.ordinality)
  into pk_name, pk_cols
  from pg_constraint c
  join unnest(c.conkey) with ordinality as x(attnum, ordinality) on true
  join pg_attribute a on a.attnum = x.attnum and a.attrelid = c.conrelid
  where c.conrelid = 'public.country_languages'::regclass and c.contype = 'p'
  group by c.conname;

  if pk_name is not null and pk_cols <> array['id'] then
    execute format('alter table public.country_languages drop constraint %I', pk_name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.country_languages'::regclass and contype = 'p'
  ) then
    alter table public.country_languages
      add constraint country_languages_pkey primary key (id);
  end if;

  -- country_timezones primary key normalization
  select c.conname, array_agg(a.attname order by x.ordinality)
  into pk_name, pk_cols
  from pg_constraint c
  join unnest(c.conkey) with ordinality as x(attnum, ordinality) on true
  join pg_attribute a on a.attnum = x.attnum and a.attrelid = c.conrelid
  where c.conrelid = 'public.country_timezones'::regclass and c.contype = 'p'
  group by c.conname;

  if pk_name is not null and pk_cols <> array['id'] then
    execute format('alter table public.country_timezones drop constraint %I', pk_name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.country_timezones'::regclass and contype = 'p'
  ) then
    alter table public.country_timezones
      add constraint country_timezones_pkey primary key (id);
  end if;

  -- country_climate_tags primary key normalization
  select c.conname, array_agg(a.attname order by x.ordinality)
  into pk_name, pk_cols
  from pg_constraint c
  join unnest(c.conkey) with ordinality as x(attnum, ordinality) on true
  join pg_attribute a on a.attnum = x.attnum and a.attrelid = c.conrelid
  where c.conrelid = 'public.country_climate_tags'::regclass and c.contype = 'p'
  group by c.conname;

  if pk_name is not null and pk_cols <> array['id'] then
    execute format('alter table public.country_climate_tags drop constraint %I', pk_name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.country_climate_tags'::regclass and contype = 'p'
  ) then
    alter table public.country_climate_tags
      add constraint country_climate_tags_pkey primary key (id);
  end if;
end $$;

create unique index if not exists country_languages_country_id_language_unique
  on public.country_languages (country_id, language);

create unique index if not exists country_timezones_country_id_timezone_unique
  on public.country_timezones (country_id, timezone);

create unique index if not exists country_climate_tags_country_id_tag_unique
  on public.country_climate_tags (country_id, tag);

create index if not exists idx_country_languages_country_id
  on public.country_languages (country_id);

create index if not exists idx_country_timezones_country_id
  on public.country_timezones (country_id);

create index if not exists idx_country_climate_tags_country_id
  on public.country_climate_tags (country_id);

-- 3) Visa path indexes for map counts
create index if not exists idx_visa_paths_country_id
  on public.visa_paths (country_id);

create index if not exists idx_visa_paths_status
  on public.visa_paths (status);

-- 4) Read model view for frontend detail pages
create or replace view public.country_profile_compact as
select
  c.id,
  c.name,
  c.iso2,
  c.regions,
  c.currency,
  c.healthcare_overview,
  c.rights_snapshot,
  c.tax_snapshot,
  c.last_verified_at,
  c.last_published_at,
  c.status,
  c.changelog_count,
  c.created_at,
  c.updated_at,
  c.lgbtq_rights_index,
  c.abortion_access_status,
  c.abortion_access_tier,
  c.hate_crime_law_snapshot,
  coalesce(
    (select array_agg(distinct cl.language order by cl.language)
     from public.country_languages cl
     where cl.country_id = c.id),
    c.languages
  ) as languages,
  coalesce(
    (select array_agg(distinct ct.timezone order by ct.timezone)
     from public.country_timezones ct
     where ct.country_id = c.id),
    c.timezones
  ) as timezones,
  coalesce(
    (select array_agg(distinct cc.tag order by cc.tag)
     from public.country_climate_tags cc
     where cc.country_id = c.id),
    c.climate_tags
  ) as climate_tags
from public.countries c;

-- 5) Pathway summary view for map counts and API usage
create or replace view public.country_pathway_summary as
select
  c.id as country_id,
  c.iso2,
  c.name,
  coalesce(
    array_agg(distinct vp.type) filter (where vp.id is not null),
    '{}'::text[]
  ) as pathway_types,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'name', vp.name,
        'type', vp.type,
        'description', vp.description
      )
    ) filter (where vp.id is not null),
    '[]'::jsonb
  ) as pathways,
  count(vp.id) filter (where vp.id is not null) as pathway_count
from public.countries c
left join public.visa_paths vp
  on vp.country_id = c.id
  and vp.status = 'published'
where c.status in ('published', 'verified')
group by c.id, c.iso2, c.name;

-- 6) RLS for normalized tables
alter table public.country_languages enable row level security;
alter table public.country_timezones enable row level security;
alter table public.country_climate_tags enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'country_languages' and policyname = 'Public can view country languages'
  ) then
    create policy "Public can view country languages"
      on public.country_languages for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'country_timezones' and policyname = 'Public can view country timezones'
  ) then
    create policy "Public can view country timezones"
      on public.country_timezones for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'country_climate_tags' and policyname = 'Public can view country climate tags'
  ) then
    create policy "Public can view country climate tags"
      on public.country_climate_tags for select
      to anon, authenticated
      using (true);
  end if;
end $$;
