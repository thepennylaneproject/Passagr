-- Data integrity constraints and RLS hardening

-- 1) Published/verified countries must have valid iso2 and safety fields
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'countries_published_iso2_check'
      and conrelid = 'public.countries'::regclass
  ) then
    alter table public.countries
      add constraint countries_published_iso2_check
      check (
        status not in ('published', 'verified')
        or (
          iso2 is not null
          and char_length(iso2) = 2
          and iso2 = upper(iso2)
        )
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'countries_published_safety_fields_check'
      and conrelid = 'public.countries'::regclass
  ) then
    alter table public.countries
      add constraint countries_published_safety_fields_check
      check (
        status not in ('published', 'verified')
        or (
          lgbtq_rights_index is not null
          and lgbtq_rights_index between 0 and 5
          and abortion_access_status is not null
          and last_verified_at is not null
        )
      ) not valid;
  end if;
end $$;

-- 2) Visa path integrity checks
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visa_paths_processing_range_check'
      and conrelid = 'public.visa_paths'::regclass
  ) then
    alter table public.visa_paths
      add constraint visa_paths_processing_range_check
      check (
        processing_min_days is null
        or processing_max_days is null
        or processing_min_days <= processing_max_days
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visa_paths_min_income_currency_check'
      and conrelid = 'public.visa_paths'::regclass
  ) then
    alter table public.visa_paths
      add constraint visa_paths_min_income_currency_check
      check (
        min_income_amount is null
        or (min_income_currency is not null and char_length(min_income_currency) = 3)
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visa_paths_min_savings_currency_check'
      and conrelid = 'public.visa_paths'::regclass
  ) then
    alter table public.visa_paths
      add constraint visa_paths_min_savings_currency_check
      check (
        min_savings_amount is null
        or (min_savings_currency is not null and char_length(min_savings_currency) = 3)
      ) not valid;
  end if;
end $$;

-- 3) Cost items must be attached to exactly one parent
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cost_items_single_parent_check'
      and conrelid = 'public.cost_items'::regclass
  ) then
    alter table public.cost_items
      add constraint cost_items_single_parent_check
      check (
        ((country_id is not null)::int + (visapath_id is not null)::int) = 1
      ) not valid;
  end if;
end $$;

-- 4) Optional source_id FKs for normalized list tables
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'country_languages_source_id_fkey'
      and conrelid = 'public.country_languages'::regclass
  ) then
    alter table public.country_languages
      add constraint country_languages_source_id_fkey
      foreign key (source_id) references public.sources(id) on delete set null not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'country_timezones_source_id_fkey'
      and conrelid = 'public.country_timezones'::regclass
  ) then
    alter table public.country_timezones
      add constraint country_timezones_source_id_fkey
      foreign key (source_id) references public.sources(id) on delete set null not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'country_climate_tags_source_id_fkey'
      and conrelid = 'public.country_climate_tags'::regclass
  ) then
    alter table public.country_climate_tags
      add constraint country_climate_tags_source_id_fkey
      foreign key (source_id) references public.sources(id) on delete set null not valid;
  end if;
end $$;

-- 5) RLS policy hardening for child/normalized tables
-- Drop permissive policies

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'requirements' and policyname = 'Public can view all requirements'
  ) then
    drop policy "Public can view all requirements" on public.requirements;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'steps' and policyname = 'Public can view all steps'
  ) then
    drop policy "Public can view all steps" on public.steps;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cost_items' and policyname = 'Public can view all cost items'
  ) then
    drop policy "Public can view all cost items" on public.cost_items;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cities' and policyname = 'Public can view all cities'
  ) then
    drop policy "Public can view all cities" on public.cities;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'country_languages' and policyname = 'Public can view country languages'
  ) then
    drop policy "Public can view country languages" on public.country_languages;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'country_timezones' and policyname = 'Public can view country timezones'
  ) then
    drop policy "Public can view country timezones" on public.country_timezones;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'country_climate_tags' and policyname = 'Public can view country climate tags'
  ) then
    drop policy "Public can view country climate tags" on public.country_climate_tags;
  end if;
end $$;

-- Create restrictive policies tied to published/verified parents
create policy "Public can view published requirements"
  on public.requirements for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.visa_paths vp
      where vp.id = requirements.visapath_id
        and vp.status = 'published'
    )
  );

create policy "Public can view published steps"
  on public.steps for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.visa_paths vp
      where vp.id = steps.visapath_id
        and vp.status = 'published'
    )
  );

create policy "Public can view published cost items"
  on public.cost_items for select
  to anon, authenticated
  using (
    (visapath_id is not null and exists (
      select 1 from public.visa_paths vp
      where vp.id = cost_items.visapath_id
        and vp.status = 'published'
    ))
    or
    (country_id is not null and exists (
      select 1 from public.countries c
      where c.id = cost_items.country_id
        and c.status in ('published', 'verified')
    ))
  );

create policy "Public can view published cities"
  on public.cities for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = cities.country_id
        and c.status in ('published', 'verified')
    )
  );

create policy "Public can view published country languages"
  on public.country_languages for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = country_languages.country_id
        and c.status in ('published', 'verified')
    )
  );

create policy "Public can view published country timezones"
  on public.country_timezones for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = country_timezones.country_id
        and c.status in ('published', 'verified')
    )
  );

create policy "Public can view published country climate tags"
  on public.country_climate_tags for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = country_climate_tags.country_id
        and c.status in ('published', 'verified')
    )
  );
