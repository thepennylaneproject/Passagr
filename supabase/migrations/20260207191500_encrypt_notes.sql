-- Purpose: Prepare user_saved_path_notes for application-layer encrypted note bodies.
-- RLS policies are intentionally unchanged in this migration.

alter table public.user_saved_path_notes
  add column if not exists body_ciphertext bytea,
  add column if not exists body_nonce bytea,
  add column if not exists body_key_version int;

-- During migration we allow both plaintext body and encrypted columns to coexist.
-- Target steady state after migration: body is null and encrypted columns are present.
alter table public.user_saved_path_notes
  drop constraint if exists ck_user_saved_path_notes_body_encryption_state;

alter table public.user_saved_path_notes
  add constraint ck_user_saved_path_notes_body_encryption_state
  check (
    (
      body is null
      and body_ciphertext is not null
      and body_nonce is not null
      and body_key_version is not null
      and body_key_version > 0
    )
    or
    (
      body is not null
      and body_ciphertext is not null
      and body_nonce is not null
      and body_key_version is not null
      and body_key_version > 0
    )
  ) not valid;

-- TODO(backfill placeholder): Safe migration steps for plaintext -> encrypted
-- 1) Deploy server-side envelope encryption module and key storage first.
-- 2) Run a backfill worker in batches (ordered by created_at, stable cursor by id):
--    - Read rows where body is not null and (body_ciphertext/body_nonce/body_key_version are null).
--    - Encrypt body via server function (never in SQL client/browser).
--    - Update row atomically: set body_ciphertext/body_nonce/body_key_version, keep body for verification period.
-- 3) Verify completeness:
--    select count(*) from public.user_saved_path_notes
--    where body is not null and (body_ciphertext is null or body_nonce is null or body_key_version is null);
-- 4) After verification window, null plaintext body in batches:
--    update public.user_saved_path_notes set body = null where body is not null and body_ciphertext is not null;
-- 5) Validate constraint after cleanup:
--    alter table public.user_saved_path_notes validate constraint ck_user_saved_path_notes_body_encryption_state;
-- 6) In a follow-up migration, consider dropping plaintext body column entirely.
