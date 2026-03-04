# Passagr Database Layer Audit Report
**Audit Date:** 2026-02-27  
**Scope:** All 46 Supabase migrations in `supabase/migrations/`, plus `scripts/data_integrity_audit.sql`, `scripts/backfill_publish_gates.sql`, and `scripts/rls_public_read_tests.ts`.

---

## Executive Summary

The public-facing content layer (countries, visa_paths, and child tables) has solid, defense-in-depth RLS that correctly gates on `status = 'published'`. However, **three critical gaps** demand immediate attention:

1. The entire `lm_*` table family (8 tables containing PII — client names, emails, and attorney contact data) has **zero RLS** and no RLS migration was ever applied.
2. `staging_country_research` has **zero RLS**, exposing raw draft import batches (unreviewed payloads) to any anon client.
3. `20260202201147_remote_schema.sql` issues a blanket **`GRANT INSERT, UPDATE, DELETE, TRUNCATE` to `anon`** on `country_languages`, `country_timezones`, and `country_climate_tags`, making those grants wildly broader than the SELECT-only public read intent.

---

## Findings Table

| # | Table / Migration | Category | Issue | Severity | Recommended Fix |
|---|---|---|---|---|---|
| 1 | `lm_clients`, `lm_intakes`, `lm_attorneys`, `lm_matches`, `lm_outreach_drafts`, `lm_review_tasks`, `lm_submissions`, `lm_audit_logs`, `lm_attorney_sources` | **RLS Completeness** | RLS is **never enabled** on any of the 8+ Legal Match tables. `lm_clients` stores `full_name` + `email` (PII); `lm_attorneys` stores `email` + `phone`. With RLS disabled, any authenticated user (or anon with correct grants) can read/write all rows across all clients. | 🔴 Critical | Enable RLS on all `lm_*` tables immediately. Apply service-role-only write policies. Add a SELECT-only policy scoped to staff roles (e.g., `to service_role`) or use a JWT custom claim `is_staff`. |
| 2 | `staging_country_research` | **Staging Gate** | Table created in `20260131162000_staging-table.sql` with no `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and no policies. Any client with the anon key can query raw, unreviewed import payloads. | 🔴 Critical | Enable RLS and add a `service_role`-only policy with `to service_role using (true)`. Anon/authenticated roles should get zero access. |
| 3 | `20260202201147_remote_schema.sql` — `country_languages`, `country_timezones`, `country_climate_tags` | **Privilege Exposure** | The remote schema dump issues `GRANT DELETE, INSERT, REFERENCES, TRIGGER, TRUNCATE, UPDATE ON ... TO anon`. These tables are public read-only. Granting destructive DML to `anon` far exceeds intent and is partially blocked only by RLS (which could be misconfigured downstream). | 🔴 Critical | Revoke all non-SELECT grants from `anon` on these three tables: `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON country_languages, country_timezones, country_climate_tags FROM anon;` |
| 4 | `v_user_saved_paths_active`, `v_user_checklists_active`, `v_user_checklist_items`, `country_profile_compact`, `country_pathway_summary` | **RLS Completeness / Views** | All five views created with `CREATE OR REPLACE VIEW` (not `SECURITY INVOKER`). Views in Postgres run with the **definer's** `search_path` and inherit the definer's role bypass. Specifically, `v_user_saved_paths_active` and `v_user_checklists_active` join user-owned tables — a user querying the view directly bypasses per-row RLS checks on `user_saved_paths`. `country_profile_compact` surfaces `status` (including draft rows) since it queries `countries` without a WHERE clause. | 🟠 High | Either convert to `SECURITY INVOKER` views (`ALTER VIEW ... SECURITY INVOKER`) or add explicit `WHERE status IN ('published','verified')` predicates in each view definition. For user data views, rely on RLS passthrough by ensuring views use `SECURITY INVOKER`. |
| 5 | `checklist_templates`, `checklist_template_items`, `template_version_links` | **RLS Policy Logic** | Policies grant SELECT to all roles including `anon` with `USING (true)`. This exposes **inactive templates** (`is_active = false`) and internal `migration_notes` in `template_version_links` to anonymous users. Not PII, but information leakage of internal editorial workflow data. | 🟠 High | Restrict SELECT to active templates only: `USING (is_active = true)`. For `template_version_links`, restrict to `TO authenticated` or service role entirely if there is no user-facing purpose. |
| 6 | `user_saved_path_notes` — `body` column | **Sensitive Column Exposure** | `20260207191500_encrypt_notes.sql` adds `body_ciphertext`/`body_nonce`/`body_key_version` and leaves the plaintext `body` column in place. The constraint allows **both plaintext and ciphertext** to coexist (`body is not null and body_ciphertext is not null` is a valid state passing the check). The plaintext `body` is directly readable via RLS SELECT policy. | 🟠 High | Execute the backfill plan documented in the migration: encrypt all existing rows, null out `body`, then validate the constraint. Set a target timeline. After validation, `ALTER TABLE user_saved_path_notes DROP COLUMN body` in a follow-up migration. |
| 7 | `user_wrapped_keys` | **RLS Completeness** | Table has RLS enabled but **literally zero policies**. Comment says "service role only" — which is correct intent but not enforced via an explicit `TO service_role` policy. Any `authenticated` user attempting a direct table access (not via service role) should be correctly rejected by RLS vacuous denial, but the absence of any explicit grant makes reasoning brittle and could cause false-positive errors in edge-case Supabase SDK behavior. | 🟡 Medium | Add an explicit `DENY` comment policy or a single `TO service_role FOR ALL USING (true)` policy to make the intent machine-readable and verifiable. |
| 8 | `deletion_requests` | **RLS Policy Logic** | Users can `INSERT` and `SELECT` their own deletion requests but have no `UPDATE` policy — specifically, no ability to **cancel** a pending request (set `status = 'cancelled'`). The comment says "no update/delete ... service role only" but it's unclear if the product requires user-initiated cancellation. If it does, a missing policy silently blocks that flow. | 🟡 Medium | Decide and document: if user cancellation is in-scope, add a restricted UPDATE policy: `FOR UPDATE USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (status = 'cancelled')`. If not, document the explicit decision in code. |
| 9 | `idempotency_keys` | **RLS Policy Logic** | `FOR ALL USING (auth.uid() = user_id)` — the `FOR ALL` policy without a `WITH CHECK` clause means the `USING` predicate is also applied as `WITH CHECK` for INSERT/UPDATE. On INSERT, `auth.uid()` must equal `user_id` in the inserted row, which is correct. However, the policy allows `UPDATE` by any authenticated user to change any column including `user_id` itself (so a user could reassign ownership of a key). | 🟡 Medium | Split into separate policies: `FOR INSERT WITH CHECK (auth.uid() = user_id)`, `FOR SELECT USING (auth.uid() = user_id)`. Remove UPDATE permission entirely — idempotency keys should be immutable once written. |
| 10 | `editorial_reviews`, `changelogs`, `freshness_policies`, `sources` | **RLS Completeness** | These four tables were created in the core schema migration but **RLS was never enabled** on them. `sources` contains URLs and publisher data (minor). `editorial_reviews` contains `reviewer_uid` (text, not UUID — see finding #12) and review notes. `changelogs` contains `created_by` (text identifier). | 🟡 Medium | Enable RLS on all four tables. For `editorial_reviews` and `changelogs`, apply service-role-only write policies and either restrict SELECT to staff only or keep read-only public access if considered non-sensitive. |
| 11 | `lm_clients.email`, `lm_attorneys.email`, `lm_attorneys.phone`, `lm_intakes.summary` | **Sensitive Column Exposure** | With no RLS (finding #1), these PII-bearing columns are fully exposed. Even when RLS is added, the `summary` field in `lm_intakes` could contain sensitive legal narrative. | 🟠 High (blocked by #1) | After enabling RLS, validate that `lm_clients` and `lm_intakes` SELECT policies strictly scope to the owning user or staff role. Consider encrypting `lm_intakes.summary` at rest with the same envelope approach used for notes. |
| 12 | `editorial_reviews.reviewer_uid` | **Schema / PII** | Column type is `text`, not `uuid`. If this stores Supabase auth UIDs it should be `uuid not null references auth.users(id)`. As `text`, it can accept any string, bypassing FK integrity, and cannot be joined to `auth.users` without casting. | 🟡 Medium | Migrate column to `uuid references auth.users(id) on delete set null`. Normalize any existing text values that are valid UUIDs. |
| 13 | `20260201180000_promote_staging_to_production.sql` through `20260201183500_promote_staging_final_v5.sql` (7 migrations) | **Migration Safety** | Six consecutive "retry" promote migrations exist (`180000` → `183500`), each performing `INSERT ... ON CONFLICT DO UPDATE` on production tables. Each appears to have been created because the prior one silently failed or partially applied. This pattern indicates **no migration-level idempotency strategy** and creates risk of double-inserts if any migration is replayed. | 🟠 High | Establish a single-promote migration pattern using `ON CONFLICT DO NOTHING` with explicit idempotency guards. Document what each of the 6 promotes covered and consider consolidating into a single authoritative seed migration. Archive the superseded ones. |
| 14 | `data_integrity_audit.sql` — Missing Coverage | **Referential Integrity** | The audit script covers `country_languages`, `country_timezones`, `country_climate_tags`, and `changelogs` orphan checks. It entirely omits: `editorial_reviews` (entity_id is not FK-constrained), the entire `lm_*` graph (no orphan check for `lm_matches → lm_intakes`, `lm_attorney_sources → lm_attorneys`), all user tables (`deletion_events → deletion_requests`, `user_checklist_item_states → user_path_checklists`), and the `cost_items → sources` FK. | 🟡 Medium | Extend `data_integrity_audit.sql` to cover all FK relationships in the schema. At minimum add: user table orphan checks, lm_* orphan checks, and `editorial_reviews` entity validation. |
| 15 | `cost_items.source_id` | **Referential Integrity** | `source_id uuid not null references sources(id)` — declared NOT NULL with a FK to `sources`. However `cost_items` are partially seeded without a matching source in migration data files. If migrate-time data lacks a valid `source_id` UUID, the constraint causes silent failures (or requires dummy source records). | 🟡 Medium | Either make `source_id` nullable (`on delete set null`) if a source isn't always available, or add a sentinel "system" source record as part of the seed migration and use it as the default. |
| 16 | `country_languages`, `country_timezones`, `country_climate_tags` — `source_id` FK | **Referential Integrity** | FK added in `20260204100000_data_integrity_and_rls.sql` with `NOT VALID` and never validated. `NOT VALID` means existing rows are not checked at constraint creation time. No follow-up `ALTER TABLE ... VALIDATE CONSTRAINT` was ever issued in subsequent migrations. | 🟡 Medium | Issue `ALTER TABLE public.country_languages VALIDATE CONSTRAINT country_languages_source_id_fkey` (and equivalent for timezones/climate_tags) in a follow-up migration after confirming no orphaned source_ids exist. |
| 17 | `user_saved_paths.canonical_path_id` | **Index Coverage** | References `visa_paths(id)` but there is no index on `user_saved_paths(canonical_path_id)`. Queries joining saved paths back to visa paths (e.g., in `v_user_saved_paths_active`) will scan the table. | 🟢 Low | `CREATE INDEX IF NOT EXISTS ix_saved_paths_canonical_path ON public.user_saved_paths (canonical_path_id);` |
| 18 | `lm_review_tasks.assignee_id` | **Index Coverage** | `assignee_id text` has no index. If HITL dashboards filter review tasks by assignee, this will scan the full table. | 🟢 Low | `CREATE INDEX IF NOT EXISTS lm_review_tasks_assignee_idx ON public.lm_review_tasks (assignee_id, status)` |
| 19 | `20260202201147_remote_schema.sql` — `drop extension if exists pg_net` | **Migration Safety** | First line drops `pg_net` without any guard for whether it is in use. If any internal Supabase Edge Function or webhook trigger depends on `pg_net`, this silently breaks outbound HTTP from the database. | 🟡 Medium | Remove this line from the migration entirely (it was clearly a remote snapshot artifact). If intentional, document why `pg_net` should be disabled and add a guard verifying no dependent objects exist. |
| 20 | `rls_public_read_tests.ts` — Test Coverage | **Verification Gap** | RLS test script only validates SELECT reads for public content tables. It does **not** test: draft content is blocked (`status = 'draft'`), `staging_country_research` is blocked to anon, user table cross-user isolation (can User A read User B's saved paths?), or any write (INSERT/UPDATE/DELETE) rejection for anon. | 🟡 Medium | Add negative test cases: query a known draft country (expect 0 rows), query staging table as anon (expect error/0 rows), attempt cross-user saved path access using a second test user's token. |

---

## Category Summary

| Category | Critical | High | Medium | Low |
|---|---|---|---|---|
| RLS Completeness | 2 (lm_*, staging) | 2 (views, templates) | 2 (editorial/sources, user_wrapped_keys) | — |
| Policy Logic | — | 1 (delete cancel) | 2 (idempotency, user cancel) | — |
| Sensitive Column / PII | 1 (anon grants) | 2 (lm_* PII blocked by #1, plaintext body) | 1 (reviewer_uid type) | — |
| Migration Safety | — | 1 (7 retry promotes) | 1 (pg_net drop) | — |
| Referential Integrity | — | — | 3 (audit coverage, NOT VALID FKs, cost_items source_id) | — |
| Index Coverage | — | — | — | 2 |
| Test Coverage | — | — | 1 | — |
| **Totals** | **3** | **6** | **9** | **2** |

---

## Priority Action Plan

### Immediate (this sprint)
1. **Enable RLS on all `lm_*` tables** with service-role-only write policies.
2. **Enable RLS on `staging_country_research`** with `TO service_role USING (true)` only.
3. **Revoke excess `anon` grants** on `country_languages`, `country_timezones`, `country_climate_tags`.

### Near-term (next migration cycle)
4. Convert `v_user_saved_paths_active` and `v_user_checklists_active` to `SECURITY INVOKER` views.
5. Add `WHERE status IN ('published', 'verified')` to `country_profile_compact`.
6. Restrict `checklist_templates` SELECT to `is_active = true`.
7. Execute plaintext body backfill and drop the `body` column after verification.
8. Enable RLS on `editorial_reviews`, `changelogs`, `freshness_policies`, `sources`.

### Backlog
9. Validate the 3 `NOT VALID` FK constraints on list tables.
10. Extend `data_integrity_audit.sql` to cover `lm_*`, user tables, and `editorial_reviews`.
11. Add missing indexes on `user_saved_paths.canonical_path_id` and `lm_review_tasks.assignee_id`.
12. Add negative RLS test cases to `rls_public_read_tests.ts`.
13. Migrate `editorial_reviews.reviewer_uid` from `text` to `uuid`.
14. Document and archive the 6 redundant staging-promote migrations.
