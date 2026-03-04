-- Purpose: User checklist system for visa path tracking
-- Template tables: service role only (no public writes)
-- User instance tables: user-owned with RLS via auth.uid()

create extension if not exists pgcrypto;

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Status for user checklist instances
create type checklist_status as enum ('not_started', 'in_progress', 'completed', 'archived');

-- Status for individual checklist items
create type checklist_item_status as enum ('incomplete', 'in_progress', 'completed', 'skipped', 'blocked');

-- Event types for timeline
create type checklist_event_type as enum (
  'checklist_created',
  'checklist_started',
  'checklist_completed',
  'checklist_archived',
  'item_completed',
  'item_uncompleted',
  'item_skipped',
  'item_blocked',
  'item_note_added'
);

-- =============================================================================
-- TEMPLATE TABLES (Service Role Only)
-- =============================================================================

-- Master templates for checklists (e.g., "H1B Visa Checklist", "Portugal D7 Checklist")
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  visa_path_id uuid references public.visa_paths(id) on delete cascade,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_checklist_templates_visa_path
  on public.checklist_templates (visa_path_id)
  where is_active = true and visa_path_id is not null;

-- Items within a checklist template
create table if not exists public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  category text,
  estimated_duration_days int,
  is_optional boolean not null default false,
  depends_on_item_id uuid references public.checklist_template_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_template_items_template_sort
  on public.checklist_template_items (template_id, sort_order);

create index if not exists ix_template_items_depends_on
  on public.checklist_template_items (depends_on_item_id)
  where depends_on_item_id is not null;

-- Template versioning/linking (for future template updates)
create table if not exists public.template_version_links (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  previous_template_id uuid references public.checklist_templates(id) on delete set null,
  version_number int not null default 1,
  migration_notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_template_version_links_template
  on public.template_version_links (template_id);

-- =============================================================================
-- USER INSTANCE TABLES (User-Owned, RLS Protected)
-- =============================================================================

-- User's instance of a checklist tied to their saved path
create table if not exists public.user_path_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_path_id uuid not null,
  template_id uuid references public.checklist_templates(id) on delete set null,
  status checklist_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint fk_checklist_saved_path_owner
    foreign key (saved_path_id, user_id)
    references public.user_saved_paths (id, user_id)
    on delete cascade
);

create unique index if not exists ux_user_path_checklists_id_user
  on public.user_path_checklists (id, user_id);

create index if not exists ix_user_path_checklists_user_status
  on public.user_path_checklists (user_id, status, created_at desc)
  where archived_at is null;

create index if not exists ix_user_path_checklists_saved_path
  on public.user_path_checklists (saved_path_id);

-- User's state for individual checklist items
create table if not exists public.user_checklist_item_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_path_checklist_id uuid not null,
  template_item_id uuid not null references public.checklist_template_items(id) on delete cascade,
  status checklist_item_status not null default 'incomplete',
  notes text,
  completed_at timestamptz,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint fk_item_state_checklist_owner
    foreign key (user_path_checklist_id, user_id)
    references public.user_path_checklists (id, user_id)
    on delete cascade
);

create unique index if not exists ux_item_states_checklist_template_item
  on public.user_checklist_item_states (user_path_checklist_id, template_item_id);

create index if not exists ix_item_states_user_checklist_status
  on public.user_checklist_item_states (user_id, user_path_checklist_id, status);

create index if not exists ix_item_states_template_item
  on public.user_checklist_item_states (template_item_id);

-- Timeline events for user checklists (audit trail and activity feed)
create table if not exists public.user_checklist_timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_path_checklist_id uuid not null,
  event_type checklist_event_type not null,
  item_state_id uuid references public.user_checklist_item_states(id) on delete cascade,
  metadata jsonb,
  created_at timestamptz not null default now(),
  
  constraint fk_timeline_checklist_owner
    foreign key (user_path_checklist_id, user_id)
    references public.user_path_checklists (id, user_id)
    on delete cascade
);

create index if not exists ix_timeline_events_checklist_created
  on public.user_checklist_timeline_events (user_path_checklist_id, created_at desc);

create index if not exists ix_timeline_events_user_created
  on public.user_checklist_timeline_events (user_id, created_at desc);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

drop trigger if exists update_checklist_templates_updated_at on public.checklist_templates;
create trigger update_checklist_templates_updated_at
before update on public.checklist_templates
for each row execute function public.update_updated_at_column();

drop trigger if exists update_checklist_template_items_updated_at on public.checklist_template_items;
create trigger update_checklist_template_items_updated_at
before update on public.checklist_template_items
for each row execute function public.update_updated_at_column();

drop trigger if exists update_user_path_checklists_updated_at on public.user_path_checklists;
create trigger update_user_path_checklists_updated_at
before update on public.user_path_checklists
for each row execute function public.update_updated_at_column();

drop trigger if exists update_user_checklist_item_states_updated_at on public.user_checklist_item_states;
create trigger update_user_checklist_item_states_updated_at
before update on public.user_checklist_item_states
for each row execute function public.update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Template tables: public READ, no public WRITE (service role only)
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.template_version_links enable row level security;

drop policy if exists checklist_templates_public_read on public.checklist_templates;
create policy checklist_templates_public_read on public.checklist_templates
  for select using (true);

drop policy if exists checklist_template_items_public_read on public.checklist_template_items;
create policy checklist_template_items_public_read on public.checklist_template_items
  for select using (true);

drop policy if exists template_version_links_public_read on public.template_version_links;
create policy template_version_links_public_read on public.template_version_links
  for select using (true);

-- User instance tables: user-owned (all operations)
alter table public.user_path_checklists enable row level security;
alter table public.user_checklist_item_states enable row level security;
alter table public.user_checklist_timeline_events enable row level security;

drop policy if exists user_path_checklists_owner_all on public.user_path_checklists;
create policy user_path_checklists_owner_all on public.user_path_checklists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_checklist_item_states_owner_all on public.user_checklist_item_states;
create policy user_checklist_item_states_owner_all on public.user_checklist_item_states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_checklist_timeline_events_owner_all on public.user_checklist_timeline_events;
create policy user_checklist_timeline_events_owner_all on public.user_checklist_timeline_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- HELPER VIEWS
-- =============================================================================

-- Active user checklists with template and path information
create or replace view public.v_user_checklists_active as
select
  upc.id,
  upc.user_id,
  upc.saved_path_id,
  upc.template_id,
  upc.status,
  upc.started_at,
  upc.completed_at,
  upc.created_at,
  upc.updated_at,
  ct.name as template_name,
  ct.description as template_description,
  usp.saved_label as path_label,
  vp.name as visa_path_name,
  vp.type as visa_path_type
from public.user_path_checklists upc
left join public.checklist_templates ct on ct.id = upc.template_id
left join public.user_saved_paths usp on usp.id = upc.saved_path_id
left join public.visa_paths vp on vp.id = usp.canonical_path_id
where upc.archived_at is null;

-- User checklist item states with template item details
create or replace view public.v_user_checklist_items as
select
  ucis.id,
  ucis.user_id,
  ucis.user_path_checklist_id,
  ucis.template_item_id,
  ucis.status,
  ucis.notes,
  ucis.completed_at,
  ucis.blocked_reason,
  ucis.created_at,
  ucis.updated_at,
  cti.title as item_title,
  cti.description as item_description,
  cti.sort_order,
  cti.category,
  cti.estimated_duration_days,
  cti.is_optional,
  cti.depends_on_item_id
from public.user_checklist_item_states ucis
join public.checklist_template_items cti on cti.id = ucis.template_item_id;
