# Search Synchronization Worker & Index Schema Audit

**Date:** 2026-02-27  
**Scope:** `search/sync_worker.ts`, `search/schema.json`, `workers/publisher.ts`, `api/jobs.ts`, Supabase migrations  
**Search Provider:** Typesense

---

## Executive Summary

The search sync infrastructure is **largely undeployed stub code**. The most critical finding is that neither `publisher.ts` nor `api/jobs.ts` actually calls `sync_worker.handler` — both contain only commented-out or `console.log`-simulated invocations. The worker itself has meaningful correctness problems even when it is eventually wired up. Six distinct risk categories were identified, covering zero active sync dispatch, schema misalignments, unpublished-data safety, error swallowing, and payload size.

---

## 1. Race Conditions & Reconciliation

### Finding

There is **no active search sync dispatch path**. In `publisher.ts` (line 193–194), the sync trigger is a dead comment:

```ts
// `await searchSyncWorker.enqueue({ entityType: entity_type, entityId: updatedEntity.id });`
```

In `api/jobs.ts` `handleIndexRefresh` (lines 112–113), the hourly catch-up job performs the DB query but then only logs:

```ts
// In production, this would trigger the search sync worker
console.log(`Would sync ${totalUpdated} entities to search index`);
```

**Neither code path actually calls `sync_worker.handler`.** The search index is never updated from any publish or refresh event.

Even if the worker were wired in, there is no durable queue, no retry table, no dead-letter mechanism, and no idempotency key protecting against double-enqueue. A worker crash after a DB write but before a Typesense upsert leaves the index stale with no automatic recovery.

### Risk

| Dimension            | Assessment                                     |
| -------------------- | ---------------------------------------------- |
| **Severity**         | 🔴 Critical                                    |
| **Likelihood**       | Certain (happens on every publish)             |
| **Impact**           | Search index reflects zero post-launch changes |
| **OWASP / Category** | Integrity Failure                              |

**Recommendation:** Wire `publisher.ts` to call `handler` synchronously, or push a task to a durable queue (e.g., a `search_sync_queue` Postgres table with `status`, `attempts`, `last_error` columns). The hourly `handleIndexRefresh` loop is a good catch-up pattern but must actually invoke the worker per entity.

---

## 2. Sync Correctness — CRUD Coverage & Soft Deletes

### Finding

#### 2a. Covered entity types

`sync_worker.ts` only handles `countries` and `visa_paths`. `publisher.ts` handles 6 entity types: `country`, `visa_path`, `requirement`, `step`, `cost_item`, `source`, `city`. Updates to `requirements`, `steps`, `cost_items`, `cities`, and `sources` are invisible to the search index.

#### 2b. Soft-delete gap

When a `visa_path` or `country` has its `status` changed from `published` to something else (e.g., `draft`, `archived`), `sync_worker.handler` is not invoked with a "delete" signal. The deletion path inside the worker (lines 126–132) only fires when the DB query returns no row — which only happens if:

- `status` field is set to a non-`published` value **and**
- The worker happens to be called again for that entity.

Since the dispatch is already broken (Finding 1), a record that is un-published stays in the Typesense index indefinitely. There is no explicit delete trigger.

#### 2c. True hard deletes

There is no mechanism to detect `DELETE` statements on `countries` or `visa_paths`. A cascade-deleted visa path would linger in the search index permanently.

#### 2d. status field not 'published' acts as implicit delete

The worker's design intention — query with `.eq('status', 'published')` and delete on miss — is the right pattern. The implementation gap is only in dispatch, not in the deletion logic itself. Once wired, this would handle soft-deletes correctly.

### Risk

| Finding                                     | Severity    | Likelihood                  | Impact                              |
| ------------------------------------------- | ----------- | --------------------------- | ----------------------------------- |
| 2a. Missing entity types                    | 🟡 Medium   | Certain                     | Stale data for requirements/steps   |
| 2b. Status-change deletions never triggered | 🔴 Critical | Certain (tied to Finding 1) | Unpublished records stay in index   |
| 2c. Hard deletes not covered                | 🟡 Medium   | Possible                    | Ghost records after cascade deletes |

**Recommendation:** Expand `SyncTask.entityType` or route changes for requirements/steps through parent-entity re-index. Add a DB trigger or `updated_at`-polling pass specifically for status transitions.

---

## 3. Schema Alignment

### Finding

Cross-referencing `search/schema.json` against migrations and `sync_worker.ts` reveals several gaps.

#### 3a. Fields in `schema.json` with no counterpart in `transformDocument`

| Collection   | Schema field                 | Status                                                                                                                                                                                                                                                         |
| ------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visa_paths` | `eligibility`                | Schema says `string[]`, but worker produces `eligibility_terms` (array). **Field name mismatch.**                                                                                                                                                              |
| `visa_paths` | `in_country_conversion_path` | Present in schema, **not emitted** by `transformDocument` (the field is fetched by `publisher.ts` but not selected in the worker query and not added to the payload).                                                                                          |
| `visa_paths` | `name`                       | Present in schema (sort field), also in base — but `visa_paths` table's `name` column is a visa program name (e.g., "Digital Nomad Visa"), not a country name. This is correctly propagated, but the schema `default_sorting_field: last_verified_at` is fine. |
| `countries`  | `hate_crime_law_snapshot`    | Present in schema, **not emitted** by `transformDocument` for countries.                                                                                                                                                                                       |
| `countries`  | `timezones`                  | Present in `country_profile_compact` view (which the worker queries), **not emitted** by `transformDocument`.                                                                                                                                                  |
| `countries`  | `abortion_access_tier`       | Present in DB and view, **not emitted** by `transformDocument`.                                                                                                                                                                                                |

#### 3b. Fields emitted by worker but absent from `schema.json`

| Collection   | Worker field                                                                                                                      | Risk                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `countries`  | `content` (concatenated text blob)                                                                                                | Not in schema — Typesense will auto-index as `string` with no type enforcement.    |
| `countries`  | `abortion_access_tier`                                                                                                            | Emitted (line 47) via `data.abortion_access_tier` but **not in schema**.           |
| `visa_paths` | `content` (same concat pattern)                                                                                                   | Not in schema.                                                                     |
| `visa_paths` | `country_name`                                                                                                                    | Is in schema (`optional: true`) ✅                                                 |
| `visa_paths` | `eligibility_terms`                                                                                                               | Worker emits `eligibility_terms`, schema defines `eligibility`. **Name mismatch.** |
| `visa_paths` | `dependents_rules`, `renewal_rules`, `to_pr_citizenship_timeline`, `min_savings_amount`, `min_savings_currency`, `search_version` | Emitted by worker, **absent from schema**.                                         |

#### 3c. Non-nullable fields in schema that can be `null` in DB

| Field                        | Schema type                          | DB constraint                                |
| ---------------------------- | ------------------------------------ | -------------------------------------------- |
| `min_income_amount`          | `float` (non-optional)               | `numeric`, nullable — no NOT NULL constraint |
| `description`                | `string` (non-optional)              | `text`, nullable                             |
| `work_rights`                | `string` (non-optional)              | `text`, nullable                             |
| `in_country_conversion_path` | `string` (non-optional)              | `text`, nullable                             |
| `currency`                   | `string` (non-optional in countries) | `char(3)`, nullable                          |
| `hate_crime_law_snapshot`    | `string` (non-optional)              | `text`, nullable                             |
| `lgbtq_rights_index`         | `int32` (non-optional)               | `int not null default 0` ✅                  |

Passing `null` into a non-optional Typesense field causes an **indexing rejection** for that document.

### Risk

| Finding                                                      | Severity    | Likelihood                                                                                      |
| ------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- |
| 3a. `eligibility` vs `eligibility_terms` name mismatch       | 🔴 Critical | Certain — all visa path docs index with wrong field name                                        |
| 3a. `in_country_conversion_path` in schema but never emitted | 🔴 Critical | Certain — facet queries on this field return nothing                                            |
| 3a. `hate_crime_law_snapshot` in schema but not emitted      | 🟡 Medium   | Certain                                                                                         |
| 3b. `content` blob unschematized                             | 🟡 Medium   | Low — Typesense accepts it but it's implicit                                                    |
| 3c. Nullable fields in non-optional schema slots             | 🔴 Critical | High — any country without `currency` or any visa path without `description` will fail to index |

**Recommendation:** Audit `schema.json` against `transformDocument` output field-by-field. Mark all nullable DB fields as `optional: true` in the Typesense schema. Rename `eligibility` → `eligibility_terms` in the schema (or vice versa) to resolve the mismatch.

---

## 4. Unpublished Data Leakage

### Finding

The worker correctly gates on `.eq('status', 'published')` (line 122). If the query returns no data (record is `draft`, `staged`, `verified`, or any other non-`published` status), the worker falls through to a **delete** call, removing the record from the index. This is the correct behavior.

However, two secondary concerns exist:

**4a. `country_profile_compact` view has no status filter.** The worker queries this view for countries and relies on the application-layer `.eq('status', 'published')` filter. The view itself exposes all rows regardless of status (including `draft` and `verified`). If the `.eq()` filter were accidentally removed or the view used directly elsewhere, unpublished data would surface.

**4b. `visa_paths` country join resolves `Unknown` silently.** For a `visa_path` where the parent country is not found (e.g., country was deleted), the worker sets `country_name: 'Unknown'` (line 76). This is not a security leak but is a data quality issue.

### Risk

| Finding                                 | Severity      | Likelihood                                   |
| --------------------------------------- | ------------- | -------------------------------------------- |
| 4a. View has no RLS-equivalent filter   | 🟠 Low-Medium | Low — currently correct due to worker filter |
| 4b. Missing parent → `Unknown` in index | 🟢 Low        | Rare                                         |

**Recommendation:** Add `WHERE status = 'published'` to the `country_profile_compact` view definition as a defense-in-depth measure. This is safe because the view is only consumed by the public-facing read path and sync worker.

---

## 5. Error Handling

### Finding

#### 5a. Typesense deletion silently swallows all errors

Lines 126–132:

```ts
try {
  await typesenseClient
    .collections(collectionName)
    .documents(entityId)
    .delete();
} catch {}
```

All errors from the delete call are silently discarded. If Typesense is unavailable, a document that should be removed stays in the index. There is no log, no alert, and no retry.

#### 5b. Typesense upsert has no error handling at all

Lines 138–141:

```ts
await typesenseClient.collections(collectionName).documents().upsert(document);
```

There is no `try/catch` around the upsert. An unhandled rejection propagates to whatever called `handler`. If the caller does not handle rejections (which is the case given the dispatch is currently a simulated `console.log`), the error is silently lost. No document enters a dead-letter queue.

#### 5c. `handler` has no idempotency

If the same task is dispatched twice (e.g., due to a retry after a transient network failure), both upserts will execute. In practice, Typesense `upsert` is idempotent for the same document ID, so this is not destructive — but it can produce spurious latency under load.

### Risk

| Finding                              | Severity    | Likelihood                             |
| ------------------------------------ | ----------- | -------------------------------------- |
| 5a. Delete errors silently swallowed | 🔴 Critical | Certain when Typesense is unavailable  |
| 5b. Upsert has no error handling     | 🔴 Critical | Certain under Typesense unavailability |
| 5c. No idempotency key               | 🟢 Low      | Low — upsert is naturally idempotent   |

**Recommendation:**

```ts
// Replace the bare catch {} with:
} catch (err) {
  console.error(`[search-sync] Failed to delete ${collectionName}:${entityId}`, err)
  throw err  // re-throw so durable queue can retry
}
// Add try/catch around upsert:
try {
  await typesenseClient.collections(collectionName).documents().upsert(document)
} catch (err) {
  console.error(`[search-sync] Failed to upsert ${collectionName}:${entityId}`, err)
  throw err
}
```

---

## 6. Payload Size

### Finding

#### 6a. `content` field is an unbounded free-text concatenation

For `countries`, lines 48–55:

```ts
content: [data.healthcare_overview, data.rights_snapshot, data.tax_snapshot]
  .filter(Boolean)
  .join(" ");
```

For `visa_paths`, the `content` field joins `description`, all eligibility terms, `work_rights`, `dependents_rules`, and serialized fees. All of these DB columns are `text` with no length constraint. A single record where `healthcare_overview` is a long essay (already seen in migration data at several thousand words) could produce a `content` value of >50 KB per document.

Typesense has a default per-document size limit of 1 MB, but indexing many large `content` blobs degrades memory usage and search latency significantly. The field is not in `schema.json`, so it receives no `type` enforcement.

#### 6b. `description` and `work_rights` are also unbounded

Both are `text` in the DB, `string` (non-optional, non-limited) in the schema. No length cap is applied before indexing.

#### 6c. `eligibility_terms` and array fields

`eligibility` is stored as `jsonb` in the DB with no cardinality constraint. An `eligibility` array of 200 items would bloat the search document significantly.

### Risk

| Finding                                   | Severity  | Likelihood                               |
| ----------------------------------------- | --------- | ---------------------------------------- |
| 6a. Unbounded `content` blob              | 🟡 Medium | Medium — depends on editorial discipline |
| 6b. Unbounded `description`/`work_rights` | 🟢 Low    | Low — unlikely to be pathological        |
| 6c. Unbounded eligibility arrays          | 🟢 Low    | Low                                      |

**Recommendation:** Truncate `content` at a safe ceiling (e.g., 10 000 chars) before indexing. Add a length check in `transformDocument`:

```ts
content: rawContent.length > 10_000 ? rawContent.slice(0, 10_000) : rawContent,
```

Do not rely on editorial discipline to bound this.

---

## Risk Matrix Summary

| ID  | Category         | Issue                                                                         | Severity    | Likelihood | Impact                                |
| --- | ---------------- | ----------------------------------------------------------------------------- | ----------- | ---------- | ------------------------------------- |
| R1  | Race Conditions  | Sync worker is never actually called — dispatch is commented out or simulated | 🔴 Critical | Certain    | Index is 100% stale                   |
| R2a | CRUD Coverage    | `requirements`, `steps`, `cost_items`, `cities` not synced                    | 🟡 Medium   | Certain    | Partial index coverage                |
| R2b | CRUD Coverage    | Status-change deletions never triggered                                       | 🔴 Critical | Certain    | Un-published records persist in index |
| R2c | CRUD Coverage    | Hard deletes (SQL DELETE) not covered                                         | 🟡 Medium   | Possible   | Ghost records                         |
| R3a | Schema Alignment | `eligibility` vs `eligibility_terms` field name mismatch                      | 🔴 Critical | Certain    | Facet/filter queries broken           |
| R3b | Schema Alignment | `in_country_conversion_path` in schema, never emitted                         | 🔴 Critical | Certain    | Field always empty in index           |
| R3c | Schema Alignment | Nullable DB fields in non-optional schema slots                               | 🔴 Critical | High       | Document indexing rejections          |
| R3d | Schema Alignment | `hate_crime_law_snapshot` in schema, not emitted                              | 🟡 Medium   | Certain    | Field always empty                    |
| R3e | Schema Alignment | `timezones`, `abortion_access_tier` emitted by view but not by worker         | 🟡 Medium   | Certain    | Missing facet data                    |
| R4a | Draft Leakage    | `country_profile_compact` view has no status filter                           | 🟠 Low-Med  | Low        | Defense-in-depth gap                  |
| R5a | Error Handling   | Delete errors silently swallowed with bare `catch {}`                         | 🔴 Critical | Certain    | Un-published docs persist silently    |
| R5b | Error Handling   | Upsert has no try/catch — throws unhandled rejections                         | 🔴 Critical | Certain    | Silently dropped updates              |
| R6a | Payload Size     | `content` blob is unbounded free text                                         | 🟡 Medium   | Medium     | Index bloat / latency degradation     |

---

## Prioritized Remediation Order

1. **[R1] Wire the sync dispatch** — Uncomment or implement the actual `handler` call in `publisher.ts` and `handleIndexRefresh`. This is the most impactful single fix.
2. **[R3a, R3b, R3c] Fix schema.json** — Rename `eligibility` → `eligibility_terms`, emit `in_country_conversion_path`, mark all nullable fields `optional: true`.
3. **[R5a, R5b] Add error handling** — Wrap both the delete and upsert in `try/catch` with logging and re-throw for queue retry.
4. **[R2b] Ensure status-change deletes are dispatched** — Add a DB trigger or polling query for status transitions away from `published`.
5. **[R2c] Handle hard deletes** — Use a `deleted_at`-style soft-delete pattern or a Postgres `DELETE` trigger to enqueue removals.
6. **[R6a] Truncate `content` blob** — Cap at 10 000 characters in `transformDocument`.
7. **[R4a] Harden the view** — Add `WHERE status = 'published'` to `country_profile_compact` as defense-in-depth.
