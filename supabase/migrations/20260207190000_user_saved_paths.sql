-- Purpose: Add user-owned saved visa path storage and comparison support.
-- Tables created: user_save_contexts, user_saved_paths, user_saved_path_notes, user_path_comparisons, user_path_comparison_items.

create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Optional user-defined context bucket (e.g., "Plan A", "Family", "Work switch")
create table if not exists public.user_save_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_user_save_contexts_active_name
  on public.user_save_contexts (user_id, lower(name))
  where deleted_at is null;

-- User-saved instance of a canonical path.
-- Same canonical_path_id can appear multiple times per user (different contexts or even same context).
create table if not exists public.user_saved_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_path_id uuid not null references public.visa_paths(id),
  context_id uuid references public.user_save_contexts(id) on delete set null,
  saved_label text,
  compare_weight smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_user_saved_paths_id_user
  on public.user_saved_paths (id, user_id);

-- Per-saved-path user notes ("reference place")
create table if not exists public.user_saved_path_notes (
  id uuid primary key default gen_random_uuid(),
  saved_path_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint fk_note_saved_path_owner
    foreign key (saved_path_id, user_id)
    references public.user_saved_paths (id, user_id)
    on delete cascade
);

-- Optional persisted comparison sets (lightweight compare groups)
create table if not exists public.user_path_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_user_path_comparisons_id_user
  on public.user_path_comparisons (id, user_id);

create table if not exists public.user_path_comparison_items (
  comparison_id uuid not null,
  saved_path_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sort_order int not null default 0,
  primary key (comparison_id, saved_path_id),
  constraint fk_comparison_owner
    foreign key (comparison_id, user_id)
    references public.user_path_comparisons (id, user_id)
    on delete cascade,
  constraint fk_comparison_saved_path_owner
    foreign key (saved_path_id, user_id)
    references public.user_saved_paths (id, user_id)
    on delete cascade
);

-- Helpful indexes (active rows only)
create index if not exists ix_saved_paths_user_active_created
  on public.user_saved_paths (user_id, created_at desc)
  where deleted_at is null;

create index if not exists ix_saved_paths_user_active_canonical
  on public.user_saved_paths (user_id, canonical_path_id)
  where deleted_at is null;

create index if not exists ix_notes_user_active_saved_path
  on public.user_saved_path_notes (user_id, saved_path_id, created_at desc)
  where deleted_at is null;

create index if not exists ix_comparisons_user_active
  on public.user_path_comparisons (user_id, created_at desc)
  where deleted_at is null;

create index if not exists ix_comparison_items_user_sort
  on public.user_path_comparison_items (user_id, comparison_id, sort_order);

-- Keep updated_at current
drop trigger if exists update_user_save_contexts_updated_at on public.user_save_contexts;
create trigger update_user_save_contexts_updated_at
before update on public.user_save_contexts
for each row execute function public.update_updated_at_column();

drop trigger if exists update_user_saved_paths_updated_at on public.user_saved_paths;
create trigger update_user_saved_paths_updated_at
before update on public.user_saved_paths
for each row execute function public.update_updated_at_column();

drop trigger if exists update_user_saved_path_notes_updated_at on public.user_saved_path_notes;
create trigger update_user_saved_path_notes_updated_at
before update on public.user_saved_path_notes
for each row execute function public.update_updated_at_column();

drop trigger if exists update_user_path_comparisons_updated_at on public.user_path_comparisons;
create trigger update_user_path_comparisons_updated_at
before update on public.user_path_comparisons
for each row execute function public.update_updated_at_column();

-- RLS
alter table public.user_save_contexts enable row level security;
alter table public.user_saved_paths enable row level security;
alter table public.user_saved_path_notes enable row level security;
alter table public.user_path_comparisons enable row level security;
alter table public.user_path_comparison_items enable row level security;

drop policy if exists user_save_contexts_owner_all on public.user_save_contexts;
create policy user_save_contexts_owner_all on public.user_save_contexts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_saved_paths_owner_all on public.user_saved_paths;
create policy user_saved_paths_owner_all on public.user_saved_paths
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_saved_path_notes_owner_all on public.user_saved_path_notes;
create policy user_saved_path_notes_owner_all on public.user_saved_path_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_path_comparisons_owner_all on public.user_path_comparisons;
create policy user_path_comparisons_owner_all on public.user_path_comparisons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_path_comparison_items_owner_all on public.user_path_comparison_items;
create policy user_path_comparison_items_owner_all on public.user_path_comparison_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.v_user_saved_paths_active as
select
  usp.id,
  usp.user_id,
  usp.canonical_path_id,
  usp.context_id,
  usp.saved_label,
  usp.compare_weight,
  usp.created_at,
  usp.updated_at,
  vp.name as canonical_name,
  vp.type as canonical_type
from public.user_saved_paths usp
join public.visa_paths vp on vp.id = usp.canonical_path_id
where usp.deleted_at is null;
