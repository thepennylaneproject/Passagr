-- Allow public read access for published and verified content.
-- Aligns RLS policies with frontend queries that include verified records.

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'countries'
      and policyname = 'Public can view published countries'
  ) then
    drop policy "Public can view published countries" on public.countries;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'visa_paths'
      and policyname = 'Public can view published visa paths'
  ) then
    drop policy "Public can view published visa paths" on public.visa_paths;
  end if;
end $$;

create policy "Public can view published countries"
  on public.countries for select
  to anon, authenticated
  using (status in ('published', 'verified'));

create policy "Public can view published visa paths"
  on public.visa_paths for select
  to anon, authenticated
  using (status in ('published', 'verified'));
