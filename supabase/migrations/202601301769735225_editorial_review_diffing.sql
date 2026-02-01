-- Editorial review diffing support

-- Store full proposed entity payload for comparison
alter table editorial_reviews
  add column proposed_data jsonb;

-- Store human-readable diff summary
alter table editorial_reviews
  add column diff_summary text;

-- Store structured per-field diffsnpx
alter table editorial_reviews
  add column diff_fields jsonb;

-- Speed up pending / filtered review queries
create index if not exists idx_editorial_reviews_status
  on editorial_reviews(status);
