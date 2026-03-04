-- Backfill country fields and normalized list tables from staging payloads and existing arrays.

create or replace function public.classify_abortion_access_tier(input_text text)
returns public.abortion_access_tier
language plpgsql
as $$
declare
  s text;
begin
  if input_text is null then
    return 'restricted';
  end if;

  s := lower(input_text);

  if s like '%protected%' then
    return 'protected';
  end if;

  if s like '%decriminalized%' then
    return 'decriminalized';
  end if;

  return 'restricted';
end $$;

-- Helper CTE to pick a single staging row per country (latest by imported_at).
with staging_latest as (
  select distinct on (coalesce(
    nullif(payload->'country'->>'iso2', ''),
    nullif(payload->>'iso2', ''),
    nullif(iso2, ''),
    nullif(country_name, '')
  ))
    *
  from public.staging_country_research
  order by
    coalesce(
      nullif(payload->'country'->>'iso2', ''),
      nullif(payload->>'iso2', ''),
      nullif(iso2, ''),
      nullif(country_name, '')
    ),
    imported_at desc
)
update public.countries c
set
  iso2 = coalesce(
    c.iso2,
    s.payload->'country'->>'iso2',
    s.payload->>'iso2',
    s.iso2
  ),
  regions = case
    when c.regions is null or array_length(c.regions, 1) is null or array_length(c.regions, 1) = 0 then
      array[coalesce(s.payload->'country'->>'region', s.payload->>'region')]
    else c.regions
  end,
  lgbtq_rights_index = case
    when c.lgbtq_rights_index = 0 then
      coalesce(
        (s.payload->'rights_and_safety'->>'lgbtq_rights_score')::int,
        (s.payload->>'lgbtq_rights_index')::int,
        c.lgbtq_rights_index
      )
    else c.lgbtq_rights_index
  end,
  abortion_access_status = coalesce(
    c.abortion_access_status,
    s.payload->'rights_and_safety'->>'abortion_status',
    s.payload->>'abortion_access'
  ),
  last_verified_at = coalesce(
    c.last_verified_at,
    (s.payload->'country'->>'last_verified_at')::timestamptz,
    (s.payload->'verification'->>'verified_at')::timestamptz
  )
from staging_latest s
where
  (c.iso2 is null and (
    lower(c.name) = lower(coalesce(s.country_name, s.payload->'country'->>'name'))
  ))
  or (c.iso2 = coalesce(s.payload->'country'->>'iso2', s.payload->>'iso2', s.iso2));

update public.countries
set abortion_access_tier = public.classify_abortion_access_tier(abortion_access_status);

-- Normalize languages/timezones/climate tags from existing arrays on countries.
insert into public.country_languages (country_id, language, is_primary)
select c.id, lang, false
from public.countries c
cross join unnest(c.languages) as lang
where coalesce(nullif(lang, ''), '') <> ''
on conflict (country_id, language) do nothing;

insert into public.country_timezones (country_id, timezone)
select c.id, tz
from public.countries c
cross join unnest(c.timezones) as tz
where coalesce(nullif(tz, ''), '') <> ''
on conflict (country_id, timezone) do nothing;

insert into public.country_climate_tags (country_id, tag)
select c.id, tag
from public.countries c
cross join unnest(c.climate_tags) as tag
where coalesce(nullif(tag, ''), '') <> ''
on conflict (country_id, tag) do nothing;

-- Normalize from staging payloads if arrays exist.
insert into public.country_languages (country_id, language, is_primary)
select c.id, trim(value), false
from public.staging_country_research s
join public.countries c
  on c.iso2 = coalesce(s.payload->'country'->>'iso2', s.payload->>'iso2', s.iso2)
cross join lateral jsonb_array_elements_text(
  case
    when s.payload ? 'languages' then s.payload->'languages'
    when (s.payload ? 'country') and (s.payload->'country' ? 'languages') then s.payload->'country'->'languages'
    else '[]'::jsonb
  end
) as value
on conflict (country_id, language) do nothing;

insert into public.country_timezones (country_id, timezone)
select c.id, trim(value)
from public.staging_country_research s
join public.countries c
  on c.iso2 = coalesce(s.payload->'country'->>'iso2', s.payload->>'iso2', s.iso2)
cross join lateral jsonb_array_elements_text(
  case
    when s.payload ? 'timezones' then s.payload->'timezones'
    when (s.payload ? 'country') and (s.payload->'country' ? 'timezones') then s.payload->'country'->'timezones'
    else '[]'::jsonb
  end
) as value
on conflict (country_id, timezone) do nothing;

insert into public.country_climate_tags (country_id, tag)
select c.id, trim(value)
from public.staging_country_research s
join public.countries c
  on c.iso2 = coalesce(s.payload->'country'->>'iso2', s.payload->>'iso2', s.iso2)
cross join lateral jsonb_array_elements_text(
  case
    when s.payload ? 'climate_tags' then s.payload->'climate_tags'
    when (s.payload ? 'country') and (s.payload->'country' ? 'climate_tags') then s.payload->'country'->'climate_tags'
    else '[]'::jsonb
  end
) as value
on conflict (country_id, tag) do nothing;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'country_languages'
      and column_name = 'is_official'
  ) then
    update public.country_languages
      set is_primary = true
    where is_primary is false and is_official is true;
  end if;
end $$;
