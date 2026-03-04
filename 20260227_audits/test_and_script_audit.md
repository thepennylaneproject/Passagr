# Passagr — Test, Script & Coverage Audit
**Date:** 2026-02-27 | **Auditor:** Antigravity

---

## 1. Test Coverage Gaps

### What the `tests/` suite actually covers

| File | Scope | Verdict |
|---|---|---|
| [tests/admin.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/admin.test.ts) | `api/admin` auth + SQL-injection whitelist | ✅ Reasonable — covers auth, rejection, and whitelist logic |
| [tests/api.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/api.test.ts) | Public API routes | ❌ **Entire file is `describe.skip`** — zero runtime coverage |
| [tests/e2e-app.test.tsx](file:///Users/sarahsahl/Desktop/passagr/tests/e2e-app.test.tsx) | Frontend App: browse → filter → open path | ✅ Good — covers 3 user flows + error state |
| [tests/formatters.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/formatters.test.ts) | `src/lib/formatters` utility functions | ✅ Good unit coverage |
| [tests/jobs.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/jobs.test.ts) | Cron-job endpoints (auth + job names) | ⚠️ Shallow — asserts `job` name and `timestamp` fields only; does not mock or validate actual worker execution |
| [tests/public_api.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/public_api.test.ts) | Published-status filtering in SQL queries | ✅ Solid — verifies the right `status` filters reach the DB |

### Critical paths with **zero** automated test coverage

| Module | Path | Risk |
|---|---|---|
| **Pipeline workers** | [workers/differ.ts](file:///Users/sarahsahl/Desktop/passagr/workers/differ.ts), [workers/publisher.ts](file:///Users/sarahsahl/Desktop/passagr/workers/publisher.ts), [workers/editorial_router.ts](file:///Users/sarahsahl/Desktop/passagr/workers/editorial_router.ts) | 🔴 HIGH — no unit tests at all; the entire ingest/diff/publish flow is untested |
| **Privacy deletion worker** | [netlify/functions/v1-privacy-deletion-worker.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts) | 🔴 HIGH — GDPR-sensitive; no test coverage |
| **Privacy export worker** | [netlify/functions/v1-privacy-exports-worker.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts) | 🔴 HIGH — exposes user PII in zip archive; no test coverage |
| **Privacy request endpoints** | `v1-privacy-deletion-requests-*.ts`, `v1-privacy-exports-*.ts` | 🔴 HIGH — auth and state machine; no tests |
| **Differ idempotency** | [differ.ts](file:///Users/sarahsahl/Desktop/passagr/workers/differ.ts) no-change early-exit path | 🟠 MEDIUM — `return null` on no diff; untested edge case |
| **Alert writer** | [workers/alert_writer.ts](file:///Users/sarahsahl/Desktop/passagr/workers/alert_writer.ts) | 🟠 MEDIUM — alerting pipeline completely untested |
| **Freshness scanner & link checker** | [workers/freshness_scanner.ts](file:///Users/sarahsahl/Desktop/passagr/workers/freshness_scanner.ts), [workers/link_checker.ts](file:///Users/sarahsahl/Desktop/passagr/workers/link_checker.ts) | 🟠 MEDIUM — complex scanning logic; no tests |
| **Search sync** | `search/` | 🟠 MEDIUM — index sync correctness untested |
| **`editorial_router` auto-publish branch** | Lines 83–90 in [editorial_router.ts](file:///Users/sarahsahl/Desktop/passagr/workers/editorial_router.ts) | 🟡 LOW-MED — `medium`/[low](file:///Users/sarahsahl/Desktop/passagr/test_editorial.ts#5-122) impact auto-publish paths are TODO stubs and untested |

---

## 2. RLS Test Completeness ([scripts/rls_public_read_tests.ts](file:///Users/sarahsahl/Desktop/passagr/scripts/rls_public_read_tests.ts))

### What it tests
The script uses the **anon key** (public JWT) to read from: `countries`, `cities`, `country_languages`, `country_timezones`, `country_climate_tags`, `visa_paths`, `requirements`, `steps`.

### Gaps

| Gap | Severity | Detail |
|---|---|---|
| **No negative (deny) tests** | 🔴 HIGH | The script never attempts to read rows that *should* be blocked (e.g., `status = 'draft'` countries, other users' rows). A failing RLS policy would silently pass. |
| **`countries` status filter is in the query, not as an RLS test** | 🔴 HIGH | The script filters `.in('status', ['published', 'verified'])` itself — it doesn't verify that the *database* would block unrestricted access to draft rows. |
| **No auth'd user context tested** | 🟠 MEDIUM | No case for an authenticated user reading their own data vs another user's data. |
| **Missing tables** | 🟠 MEDIUM | Several tables audited in the DB layer audit (e.g., `country_healthcare_metrics`, `country_quality_of_life`, `editorial_reviews`, `changelogs`, `sources`, `cost_items`) are not tested. |
| **Assertions are equality, not coverage** | 🟡 LOW | [assert(row.country_id === countryId, ...)](file:///Users/sarahsahl/Desktop/passagr/scripts/rls_public_read_tests.ts#15-20) only verifies data *was returned for the right parent*, not that *unreachable rows were absent*. |
| **[verify_safety_columns.ts](file:///Users/sarahsahl/Desktop/passagr/verify_safety_columns.ts)** | ℹ️ INFO | This script verifies schema column existence, not RLS. It runs against whatever `DATABASE_URL` is set — could target prod if not careful. |

---

## 3. Script Safety — Destructive Operations

### [scripts/backfill_country_healthcare_and_climate.cjs](file:///Users/sarahsahl/Desktop/passagr/scripts/backfill_country_healthcare_and_climate.cjs)
| Finding | Risk |
|---|---|
| **No `--dry-run` flag** | 🔴 HIGH — immediately writes to DB; no preview of what will change |
| **No confirmation prompt** | 🔴 HIGH — starts executing on [main()](file:///Users/sarahsahl/Desktop/passagr/scripts/backfill_country_healthcare_and_climate.cjs#142-260) invocation with zero human acknowledgment |
| Hardcoded `shouldReplace` logic for Portugal | 🟠 MEDIUM — `DELETE FROM country_climate_tags WHERE country_id = $1` fires unconditionally for Portugal. If run against accidentally wrong data, this silently deletes and re-inserts |
| Transaction wraps all writes | ✅ GOOD — full rollback on any error |

### [scripts/sync_country_metadata_from_countries.cjs](file:///Users/sarahsahl/Desktop/passagr/scripts/sync_country_metadata_from_countries.cjs)
| Finding | Risk |
|---|---|
| **No `--dry-run` flag** | 🔴 HIGH — no preview of metadata changes before commit |
| **No confirmation prompt** | 🔴 HIGH |
| Only updates null/empty columns (`COALESCE` pattern) | ✅ GOOD — conservative; will not overwrite existing data |
| Transaction wraps all writes | ✅ GOOD |

### [scripts/sync_visa_paths_from_countries.cjs](file:///Users/sarahsahl/Desktop/passagr/scripts/sync_visa_paths_from_countries.cjs)
| Finding | Risk |
|---|---|
| **No `--dry-run` flag** | 🔴 HIGH |
| **No confirmation prompt** | 🔴 HIGH |
| `ON CONFLICT DO UPDATE` with `status = 'published'` hard-coded | 🟠 MEDIUM — every conflict resolution forces `status='published'` regardless of editorial state |
| `COALESCE` used for most fields | ✅ GOOD — existing non-null values are preserved |
| Transaction wraps all writes | ✅ GOOD |

---

## 4. Environment Targeting

### Summary
| Check | Status |
|---|---|
| `DATABASE_URL` validated at startup in all three scripts | ✅ — `throw new Error('DATABASE_URL is required')` called early |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` validated in [rls_public_read_tests.ts](file:///Users/sarahsahl/Desktop/passagr/scripts/rls_public_read_tests.ts) | ✅ — exits with code 1 if missing |
| **No environment label / guard** | 🔴 HIGH — no script checks whether `DATABASE_URL` is a staging vs. production host. A user who sources the wrong `.env` file will destructively write to production without warning. |
| [.env.local](file:///Users/sarahsahl/Desktop/passagr/.env.local) is the de-facto env file | ⚠️ [test_db.cjs](file:///Users/sarahsahl/Desktop/passagr/test_db.cjs) explicitly loads [.env.local](file:///Users/sarahsahl/Desktop/passagr/.env.local) via `dotenv.config({ path: '.env.local' })` — this is whichever database is configured there (could be prod). |
| No `NODE_ENV` / `APP_ENV` guard in scripts | 🟠 MEDIUM — scripts do not refuse to run if e.g. `https://db.supabase.co/prod-...` is detected in the URL |

**Recommendation:** Add a URL-pattern check at startup when `DATABASE_URL` contains `supabase.co` and no `--force-production` flag is passed. At minimum, print the target host and pause for confirmation.

---

## 5. Ad-Hoc Test File Hygiene

| File | Finding | Risk |
|---|---|---|
| [test_db.cjs](file:///Users/sarahsahl/Desktop/passagr/test_db.cjs) | Loads [.env.local](file:///Users/sarahsahl/Desktop/passagr/.env.local) and connects to `DATABASE_URL`. Logs `process.env.DATABASE_URL?.split('@')[1]` (host only — not credentials). | ✅ No hardcoded creds. Logs host, not password. |
| [test_editorial.ts](file:///Users/sarahsahl/Desktop/passagr/test_editorial.ts) | Uses fake entity IDs like `'123'` and `null`. No live DB calls (the `entity_id: null` new-entity path skips the DB lookup in [differ.ts](file:///Users/sarahsahl/Desktop/passagr/workers/differ.ts)). | ✅ No real user data or prod keys. |
| [verify_safety_columns.ts](file:///Users/sarahsahl/Desktop/passagr/verify_safety_columns.ts) | Reads `process.env.DATABASE_URL` — no hardcoded credentials. Schema-only SELECTs, no mutations. | ✅ Safe — but see env-targeting risk in §4. |
| [seed_data.ts](file:///Users/sarahsahl/Desktop/passagr/seed_data.ts) / [seed_api.js](file:///Users/sarahsahl/Desktop/passagr/seed_api.js) / [seed_data.js](file:///Users/sarahsahl/Desktop/passagr/seed_data.js) (root level) | Not explicitly tested, but none appear in [.gitignore](file:///Users/sarahsahl/Desktop/passagr/.gitignore). Should be reviewed to ensure they don't embed production UUIDs or real user records. | 🟡 LOW — worth a quick check |

**Overall:** No hardcoded API keys or credentials were found in the audited files. The biggest hygiene issue is the [.env.local](file:///Users/sarahsahl/Desktop/passagr/.env.local) dependency chain — any file that loads it unconditionally is one misconfigured environment away from hitting production.

---

## 6. GeoJSON Pipeline Correctness ([scripts/generate-country-geojson.ts](file:///Users/sarahsahl/Desktop/passagr/scripts/generate-country-geojson.ts))

### What it does
Finds a Natural Earth `.shp` shapefile, converts it via `mapshaper`, parses the GeoJSON, strips properties down to `iso2` / `name` / `pathways: []`, and writes [public/countries.geojson](file:///Users/sarahsahl/Desktop/passagr/public/countries.geojson).

### Findings

| Finding | Risk | Detail |
|---|---|---|
| **No validation of output feature count** | 🟠 MEDIUM | `console.log(... ${features.length} features)` is informational only. If mapshaper silently drops features (e.g., on a malformed SHP), the bad file is committed with no error. |
| **Stale-cache skip in [convertToGeojson](file:///Users/sarahsahl/Desktop/passagr/scripts/generate-country-geojson.ts#35-45)** | 🟠 MEDIUM | `if (fs.existsSync(GEOJSON_TEMP)) return GEOJSON_TEMP` — if an old/corrupt temp file exists, it is reused without re-running mapshaper. Could produce silently stale output. |
| **`iso2 = ''` for countries with `-99` ISO code** | 🟡 LOW | Natural Earth uses `-99` for disputed or unrecognized territories. `ISO_A2 = '-99'` will produce `iso2: '-99'` (or `''` after `.toUpperCase()`), resulting in map features with blank ISO codes that won't match DB rows. No guard or filter exists. |
| **No output schema validation** | 🟡 LOW | After writing `countries.geojson`, there is no assertion that each feature has a non-empty `iso2`, valid geometry type, or non-null `name`. |
| **`execFileSync` can throw on mapshaper error** | ✅ GOOD | Wrapped in a try/catch IIFE → exits with code 1, no partial writes. |
| **`throw` on missing shapefile** | ✅ GOOD — explicit error, not silent fail |
| **`throw` on unexpected GeoJSON structure** | ✅ GOOD — `!naturalEarth?.features` check exists |

**Recommended additions:**
1. Assert `features.length >= 150` (reasonable lower bound for world countries).
2. Filter or log features where `iso2 === '' || iso2 === '-99'`.
3. Delete the temp file before each run, or accept a `--no-cache` flag.

---

## 7. Coverage Heatmap

| Domain | Current Coverage | Estimate | Priority |
|---|---|---|---|
| **Privacy workers** (deletion, export) | No tests at all | 0% | 🔴 P0 — GDPR-critical |
| **Pipeline workers** (differ, publisher, editorial_router) | [test_editorial.ts](file:///Users/sarahsahl/Desktop/passagr/test_editorial.ts) is a manual print script, not a test runner | ~0% in CI | 🔴 P0 — core data integrity |
| **RLS (negative / deny path)** | Only positive reads tested; no deny-path assertions | 10% | 🔴 P0 — data isolation |
| **Alert writer** | Not referenced in any test file | 0% | 🟠 P1 |
| **Freshness scanner / link checker** | [jobs.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/jobs.test.ts) hits HTTP endpoint but doesn't validate worker logic | ~5% | 🟠 P1 |
| **Search sync** | Not tested | 0% | 🟠 P1 |
| **GeoJSON pipeline** | No tests; generator has partial guards | 0% | 🟠 P1 |
| **Admin API** | [admin.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/admin.test.ts) — auth + SQL injection whitelist | ~60% | 🟡 P2 — good auth coverage; no CRUD mutation tests |
| **Public API** | [public_api.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/public_api.test.ts) covers status-filter queries; [api.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/api.test.ts) is fully skipped | ~30% | 🟡 P2 |
| **Frontend (App flows)** | [e2e-app.test.tsx](file:///Users/sarahsahl/Desktop/passagr/tests/e2e-app.test.tsx) — 3 flows + error state | ~50% | 🟡 P2 |
| **Cron jobs (auth)** | [jobs.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/jobs.test.ts) — auth pass/fail, 3 endpoints | ~40% | 🟡 P2 |
| **Formatters / utilities** | [formatters.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/formatters.test.ts) covers all exported functions | ~90% | 🟢 P3 — good |
| **Script safety (dry-run)** | No CI enforcement; purely manual | 0% | 🔴 P0 — prod-safety |

---

## Top Recommendations (Priority Order)

1. **Add `--dry-run` and `--env` guards to all `scripts/backfill_*` and `scripts/sync_*`** before the next production run. Block execution if `DATABASE_URL` matches a known production host pattern without an explicit `--force` flag.

2. **Write negative-path RLS tests** — use the service-role key to insert a draft row, then use the anon key to confirm it is invisible. Cover `editorial_reviews`, `changelogs`, and `country_healthcare_metrics`.

3. **Add unit tests for [differ.ts](file:///Users/sarahsahl/Desktop/passagr/workers/differ.ts), [publisher.ts](file:///Users/sarahsahl/Desktop/passagr/workers/publisher.ts), and [editorial_router.ts](file:///Users/sarahsahl/Desktop/passagr/workers/editorial_router.ts)** using mocked Supabase/PG clients. At minimum: new-entity add path, update with critical-field change, update with no diff (early exit), unknown entity_type rejection.

4. **Add integration tests for the privacy workers** — at least: deletion request created → worker runs → user data flagged; export request created → worker runs → zip contents match expected tables.

5. **Enable or delete [tests/api.test.ts](file:///Users/sarahsahl/Desktop/passagr/tests/api.test.ts)** — a permanently-skipped test file gives false confidence that the area is "covered."

6. **Add GeoJSON output assertions** — minimum feature count, no blank `iso2` values. Delete the temp file before each run.
