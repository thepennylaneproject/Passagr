-- 1) Create a stable 3-bucket enum for UI filtering
do $$
begin
  if not exists (select 1 from pg_type where typname = 'abortion_access_bucket') then
    create type public.abortion_access_bucket as enum (
      'protected',
      'decriminalized',
      'restricted'
    );
  end if;
end $$;

-- 2) Classifier function: raw text -> 3-bucket enum (or null if unknown)
create or replace function public.classify_abortion_access_status(raw text)
returns public.abortion_access_bucket
language plpgsql
immutable
as $$
declare
  s text;
begin
  if raw is null then
    return null;
  end if;

  -- normalize whitespace + lowercase
  s := lower(trim(regexp_replace(raw, '\s+', ' ', 'g')));

  -- DECRIMINALIZED bucket
  if s like '%decriminal%' then
    return 'decriminalized';
  end if;

  -- PROTECTED bucket (broad "legal / on request / available up to x weeks" signals)
  if s like '%legal%' then
    return 'protected';
  end if;

  if s like '%on request%' then
    return 'protected';
  end if;

  if s like '%available%' then
    return 'protected';
  end if;

  if s like '%up to % week%' then
    return 'protected';
  end if;

  if s like '%protected%' then
    return 'protected';
  end if;

  if s like '%permitted%' or s like '%permissible%' then
    return 'protected';
  end if;

  -- RESTRICTED bucket (broad "banned/illegal/only in cases" signals)
  if s like '%restrict%' then
    return 'restricted';
  end if;

  if s like '%illegal%' or s like '%prohibit%' or s like '%ban%' then
    return 'restricted';
  end if;

  if s like '%only to save%' then
    return 'restricted';
  end if;

  if s like '%only in case%' then
    return 'restricted';
  end if;

  if s like '%life only%' or s like '%save the life%' then
    return 'restricted';
  end if;

  if s like '%rape%' or s like '%incest%' then
    return 'restricted';
  end if;

  -- If we cannot confidently bucket it, return null so you can fix upstream data later
  return null;
end $$;

-- 3) Add a normalized column to countries for the UI to filter on
alter table public.countries
add column if not exists abortion_access_bucket public.abortion_access_bucket;

-- 4) Backfill from existing raw text
update public.countries
set abortion_access_bucket = public.classify_abortion_access_status(abortion_access_status)
where abortion_access_bucket is null;

-- Optional: index for filtering
create index if not exists idx_countries_abortion_access_bucket
on public.countries (abortion_access_bucket);
