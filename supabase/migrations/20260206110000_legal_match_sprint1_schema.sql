-- Legal Match (Iowa) Sprint 1 schema
-- HITL-first workflow: intake -> match -> draft -> review -> submission

create extension if not exists pgcrypto;

create table if not exists public.lm_clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  preferred_language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lm_intakes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.lm_clients(id) on delete cascade,
  state char(2) not null default 'IA',
  practice_areas text[] not null,
  zip_code text,
  city text,
  urgency text not null default 'medium',
  budget_max_usd integer,
  summary text not null,
  status text not null default 'new',
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lm_intakes_state_check check (state = 'IA'),
  constraint lm_intakes_urgency_check check (urgency in ('low', 'medium', 'high')),
  constraint lm_intakes_status_check check (
    status in ('new', 'matched', 'draft_pending_review', 'in_review', 'ready_for_submit', 'closed')
  ),
  constraint lm_intakes_budget_check check (budget_max_usd is null or budget_max_usd >= 0),
  constraint lm_intakes_practice_areas_nonempty_check check (array_length(practice_areas, 1) >= 1),
  constraint lm_intakes_practice_areas_allowed_check check (
    practice_areas <@ array['personal_injury', 'civil_rights', 'employment_law', 'family_law']::text[]
  )
);

create table if not exists public.lm_attorneys (
  id uuid primary key default gen_random_uuid(),
  state char(2) not null default 'IA',
  full_name text not null,
  bar_number text,
  status text not null default 'active',
  practice_areas text[] not null,
  city text,
  counties text[] not null default '{}',
  languages text[] not null default '{}',
  phone text,
  email text,
  website text,
  source_profile_url text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lm_attorneys_state_check check (state = 'IA'),
  constraint lm_attorneys_status_check check (status in ('active', 'inactive', 'suspended')),
  constraint lm_attorneys_practice_areas_nonempty_check check (array_length(practice_areas, 1) >= 1),
  constraint lm_attorneys_practice_areas_allowed_check check (
    practice_areas <@ array['personal_injury', 'civil_rights', 'employment_law', 'family_law']::text[]
  )
);

create unique index if not exists lm_attorneys_state_bar_number_unique
  on public.lm_attorneys(state, bar_number)
  where bar_number is not null;

create index if not exists lm_attorneys_practice_areas_gin
  on public.lm_attorneys
  using gin (practice_areas);

create table if not exists public.lm_attorney_sources (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid not null references public.lm_attorneys(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  fetched_at timestamptz not null default now(),
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lm_attorney_sources_attorney_id_idx
  on public.lm_attorney_sources(attorney_id);

create table if not exists public.lm_matches (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.lm_intakes(id) on delete cascade,
  attorney_id uuid not null references public.lm_attorneys(id) on delete cascade,
  score numeric(5,2) not null,
  reasons_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lm_matches_score_check check (score >= 0 and score <= 100),
  unique (intake_id, attorney_id)
);

create index if not exists lm_matches_intake_score_idx
  on public.lm_matches(intake_id, score desc);

create table if not exists public.lm_outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.lm_intakes(id) on delete cascade,
  attorney_id uuid not null references public.lm_attorneys(id) on delete cascade,
  channel text not null,
  subject text,
  body text,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending_review',
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lm_outreach_drafts_channel_check check (channel in ('email', 'form')),
  constraint lm_outreach_drafts_status_check check (status in ('pending_review', 'approved', 'submitted', 'failed'))
);

create index if not exists lm_outreach_drafts_intake_id_idx
  on public.lm_outreach_drafts(intake_id);

create table if not exists public.lm_review_tasks (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.lm_outreach_drafts(id) on delete cascade,
  assignee_id text,
  checklist_json jsonb not null default '{}'::jsonb,
  decision text,
  notes text,
  status text not null default 'pending',
  claimed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lm_review_tasks_status_check check (
    status in ('pending', 'in_review', 'approved', 'changes_requested', 'rejected')
  ),
  constraint lm_review_tasks_decision_check check (
    decision is null or decision in ('approved', 'changes_requested', 'rejected')
  )
);

create index if not exists lm_review_tasks_status_idx
  on public.lm_review_tasks(status, created_at);

create table if not exists public.lm_submissions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.lm_outreach_drafts(id) on delete cascade,
  submitted_by text not null,
  target text not null,
  submitted_at timestamptz not null default now(),
  outcome text not null,
  error_code text,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint lm_submissions_outcome_check check (outcome in ('success', 'failure', 'skipped'))
);

create index if not exists lm_submissions_draft_id_idx
  on public.lm_submissions(draft_id);

create table if not exists public.lm_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lm_audit_logs_entity_idx
  on public.lm_audit_logs(entity_type, entity_id, created_at desc);

create index if not exists lm_audit_logs_actor_idx
  on public.lm_audit_logs(actor_id, created_at desc);

create or replace function public.lm_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lm_clients_set_updated_at on public.lm_clients;
create trigger lm_clients_set_updated_at
before update on public.lm_clients
for each row execute function public.lm_set_updated_at();

drop trigger if exists lm_intakes_set_updated_at on public.lm_intakes;
create trigger lm_intakes_set_updated_at
before update on public.lm_intakes
for each row execute function public.lm_set_updated_at();

drop trigger if exists lm_attorneys_set_updated_at on public.lm_attorneys;
create trigger lm_attorneys_set_updated_at
before update on public.lm_attorneys
for each row execute function public.lm_set_updated_at();

drop trigger if exists lm_matches_set_updated_at on public.lm_matches;
create trigger lm_matches_set_updated_at
before update on public.lm_matches
for each row execute function public.lm_set_updated_at();

drop trigger if exists lm_outreach_drafts_set_updated_at on public.lm_outreach_drafts;
create trigger lm_outreach_drafts_set_updated_at
before update on public.lm_outreach_drafts
for each row execute function public.lm_set_updated_at();

drop trigger if exists lm_review_tasks_set_updated_at on public.lm_review_tasks;
create trigger lm_review_tasks_set_updated_at
before update on public.lm_review_tasks
for each row execute function public.lm_set_updated_at();
