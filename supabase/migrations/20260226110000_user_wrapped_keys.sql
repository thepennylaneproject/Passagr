-- Purpose: Application-layer envelope encryption key storage.
-- Stores per-user wrapped DEKs (data encryption keys), versioned for rotation.

create extension if not exists pgcrypto;

create table if not exists public.user_wrapped_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  wrapped_dek text not null,
  key_version integer not null check (key_version > 0),
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  primary key (user_id, key_version)
);

create index if not exists ix_user_wrapped_keys_user_created
  on public.user_wrapped_keys (user_id, created_at desc);

create unique index if not exists ux_user_wrapped_keys_active
  on public.user_wrapped_keys (user_id)
  where rotated_at is null;

alter table public.user_wrapped_keys enable row level security;

-- No public RLS policies on purpose: service role only.
