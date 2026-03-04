-- Backlog hardening:
-- - tighten idempotency keys semantics (append-only + payload hash)
-- - add missing index for user_saved_paths.canonical_path_id
-- - attempt validation of deferred constraints added as NOT VALID

-- 1) user_saved_paths lookup index
create index if not exists ix_user_saved_paths_canonical_path_id
  on public.user_saved_paths (canonical_path_id);

-- 2) idempotency_keys request hash + append-only RLS
alter table public.idempotency_keys
  add column if not exists request_hash text;

update public.idempotency_keys
set request_hash = 'legacy'
where request_hash is null;

alter table public.idempotency_keys
  alter column request_hash set not null;

alter table public.idempotency_keys
  drop constraint if exists ck_idempotency_keys_request_hash_nonempty;

alter table public.idempotency_keys
  add constraint ck_idempotency_keys_request_hash_nonempty
  check (char_length(request_hash) > 0);

drop policy if exists idempotency_keys_user_all on public.idempotency_keys;
drop policy if exists idempotency_keys_user_select on public.idempotency_keys;
drop policy if exists idempotency_keys_user_insert on public.idempotency_keys;

create policy idempotency_keys_user_select on public.idempotency_keys
  for select using (auth.uid() = user_id);

create policy idempotency_keys_user_insert on public.idempotency_keys
  for insert with check (auth.uid() = user_id);

create or replace function public.prevent_idempotency_keys_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'idempotency_keys is append-only; updates are not allowed';
end;
$$;

drop trigger if exists trg_prevent_idempotency_keys_update on public.idempotency_keys;
create trigger trg_prevent_idempotency_keys_update
before update on public.idempotency_keys
for each row
execute function public.prevent_idempotency_keys_update();

-- 3) validate previously deferred constraints where possible.
-- Validation errors are logged and skipped so this migration remains deployable
-- in environments that still contain historical violations.
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('public.countries'::regclass, 'countries_published_iso2_check'::text),
      ('public.countries'::regclass, 'countries_published_safety_fields_check'::text),
      ('public.visa_paths'::regclass, 'visa_paths_processing_range_check'::text),
      ('public.visa_paths'::regclass, 'visa_paths_min_income_currency_check'::text),
      ('public.visa_paths'::regclass, 'visa_paths_min_savings_currency_check'::text),
      ('public.cost_items'::regclass, 'cost_items_single_parent_check'::text),
      ('public.country_languages'::regclass, 'country_languages_source_id_fkey'::text),
      ('public.country_timezones'::regclass, 'country_timezones_source_id_fkey'::text),
      ('public.country_climate_tags'::regclass, 'country_climate_tags_source_id_fkey'::text),
      ('public.country_languages'::regclass, 'country_languages_country_id_fkey'::text),
      ('public.country_timezones'::regclass, 'country_timezones_country_id_fkey'::text),
      ('public.country_climate_tags'::regclass, 'country_climate_tags_country_id_fkey'::text)
    ) as t(relid, conname)
    where exists (
      select 1
      from pg_constraint c
      where c.conrelid = t.relid
        and c.conname = t.conname
        and c.convalidated = false
    )
  loop
    begin
      execute format('alter table %s validate constraint %I', rec.relid, rec.conname);
    exception when others then
      raise notice 'Skipped validation for %.%: %', rec.relid::text, rec.conname, sqlerrm;
    end;
  end loop;
end $$;
