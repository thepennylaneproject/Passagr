-- Purpose: Privacy compliance - data deletion and export requests
-- User can insert/select their own requests/jobs
-- User cannot update status fields (service role only)

create extension if not exists pgcrypto;

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Privacy job status tracking
create type privacy_job_status as enum (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
);

-- =============================================================================
-- DELETION REQUESTS
-- =============================================================================

-- User-initiated deletion requests
create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status privacy_job_status not null default 'pending',
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_deletion_requests_user_status
  on public.deletion_requests (user_id, status, requested_at desc);

create index if not exists ix_deletion_requests_status_requested
  on public.deletion_requests (status, requested_at)
  where status in ('pending', 'in_progress');

-- =============================================================================
-- DELETION EVENTS
-- =============================================================================

-- Audit trail for deletion process
create table if not exists public.deletion_events (
  id uuid primary key default gen_random_uuid(),
  deletion_request_id uuid not null references public.deletion_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  table_name text,
  records_deleted int,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ix_deletion_events_request_created
  on public.deletion_events (deletion_request_id, created_at desc);

create index if not exists ix_deletion_events_user_created
  on public.deletion_events (user_id, created_at desc);

create index if not exists ix_deletion_events_type
  on public.deletion_events (event_type, created_at desc);

-- =============================================================================
-- EXPORT JOBS
-- =============================================================================

-- User data export requests
create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status privacy_job_status not null default 'pending',
  export_format text not null default 'json',
  file_url text,
  file_size_bytes bigint,
  expires_at timestamptz,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_export_jobs_user_status
  on public.export_jobs (user_id, status, requested_at desc);

create index if not exists ix_export_jobs_status_requested
  on public.export_jobs (status, requested_at)
  where status in ('pending', 'in_progress');

create index if not exists ix_export_jobs_expires
  on public.export_jobs (expires_at)
  where status = 'completed' and expires_at is not null;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

drop trigger if exists update_deletion_requests_updated_at on public.deletion_requests;
create trigger update_deletion_requests_updated_at
before update on public.deletion_requests
for each row execute function public.update_updated_at_column();

drop trigger if exists update_export_jobs_updated_at on public.export_jobs;
create trigger update_export_jobs_updated_at
before update on public.export_jobs
for each row execute function public.update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
alter table public.deletion_requests enable row level security;
alter table public.deletion_events enable row level security;
alter table public.export_jobs enable row level security;

-- Deletion Requests: users can insert and select their own
drop policy if exists deletion_requests_user_insert on public.deletion_requests;
create policy deletion_requests_user_insert on public.deletion_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists deletion_requests_user_select on public.deletion_requests;
create policy deletion_requests_user_select on public.deletion_requests
  for select using (auth.uid() = user_id);

-- Users cannot update or delete deletion requests (service role only)
-- No update/delete policies for users = blocked by RLS

-- Deletion Events: users can select their own
drop policy if exists deletion_events_user_select on public.deletion_events;
create policy deletion_events_user_select on public.deletion_events
  for select using (auth.uid() = user_id);

-- Users cannot insert, update, or delete deletion events (service role only)

-- Export Jobs: users can insert and select their own
drop policy if exists export_jobs_user_insert on public.export_jobs;
create policy export_jobs_user_insert on public.export_jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists export_jobs_user_select on public.export_jobs;
create policy export_jobs_user_select on public.export_jobs
  for select using (auth.uid() = user_id);

-- Users cannot update or delete export jobs (service role only)
-- No update/delete policies for users = blocked by RLS
