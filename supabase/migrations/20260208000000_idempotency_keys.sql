-- Purpose: Idempotency key tracking for privacy API operations
-- Stores idempotency keys with their responses to prevent duplicate operations

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

-- Enforce unique key per user per endpoint
create unique index if not exists ix_idempotency_keys_key_user_endpoint
  on public.idempotency_keys (key, user_id, endpoint);

-- Index for cleanup of expired keys
create index if not exists ix_idempotency_keys_created_at
  on public.idempotency_keys (created_at);

-- RLS: Users can only access their own idempotency keys
alter table public.idempotency_keys enable row level security;

drop policy if exists idempotency_keys_user_all on public.idempotency_keys;
create policy idempotency_keys_user_all on public.idempotency_keys
  for all using (auth.uid() = user_id);
