# View Source: Codebase Intelligence Extraction — Passagr

---

## SECTION 1: PROJECT IDENTITY

### 1. Project Name
**passagr-backend** (as defined in `package.json`). Branded as **Passagr**.

### 2. Repository URL
`https://github.com/thepennylaneproject/Passagr` (derived from git remote; confirmed in codebase references).

### 3. One-Line Description
From `package.json`: *"Multi-agent, source-of-truth immigration guide platform."*

Cleaner version: Passagr is a human-reviewed, AI-assisted platform that aggregates, verifies, and publishes immigration policy data — visa paths, rights snapshots, and country-level safety indicators — for people exploring relocation abroad.

### 4. Project Status
**Alpha** — Core features (map, country detail, visa path viewer, editorial pipeline, privacy/GDPR API) are functionally implemented end-to-end. Data is live in Supabase with country snapshots published. The admin review UI, search integration, and some test coverage remain incomplete or partial.

### 5. First Commit / Most Recent Commit
- **First commit in this shallow clone:** `c145d262` — "pre audit merge"
- **Most recent commit:** `10506b37` — "Initial plan" (2026-03-07)
- Full history was reset (see `clean_history.sh` in root); exact first commit date is unavailable in this clone.

> ⚠️ `[SHALLOW CLONE — full commit history not available]`

### 6. Total Number of Commits
**2 commits visible in this shallow clone.** The repository was cleaned with `clean_history.sh`; the original commit count is not recoverable from this clone.

> ⚠️ `[NOT FOUND IN CODEBASE — history was squashed/cleaned]`

### 7. Deployment Status
**Deployed.** Evidence:
- `netlify.toml` defines a full Netlify build+publish pipeline (`npm run build` → `dist/`).
- `infra/cron.yaml` references `https://api.passagr.com/jobs/...` as the production API target.
- Supabase migration files indicate a live, managed Postgres instance with 46+ applied migrations and published country data.

### 8. Live URLs
| Endpoint | URL |
|---|---|
| Backend API (inferred from cron config) | `https://api.passagr.com` |
| Frontend (Netlify) | `[NOT FOUND — no explicit frontend URL in config]` |
| Supabase project | `[NOT FOUND — URL is a runtime env var, not hardcoded]` |

---

## SECTION 2: TECHNICAL ARCHITECTURE

### 1. Primary Languages and Frameworks

| Technology | Version |
|---|---|
| TypeScript | `^5.3.3` |
| React | `^19.2.1` |
| React DOM | `^19.2.1` |
| Vite (frontend build) | `^7.2.6` |
| Express (API server) | `^4.18.2` |
| Node.js | (no explicit version pinned; `ts-node ^10.9.2`) |
| Tailwind CSS | `^4.1.17` |
| Supabase JS client | `^2.39.3` |

### 2. Full Dependency List

#### Core Framework
| Package | Version | Purpose |
|---|---|---|
| `react` | `^19.2.1` | UI framework |
| `react-dom` | `^19.2.1` | DOM rendering |
| `express` | `^4.18.2` | HTTP API server |
| `typescript` | `^5.3.3` | Type safety |

#### UI / Styling
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | `^4.1.17` | Utility-first CSS |
| `@tailwindcss/postcss` | `^4.1.17` | PostCSS integration |
| `postcss` | `^8.5.6` | CSS processing |
| `autoprefixer` | `^10.4.22` | Vendor prefixing |
| `lucide-react` | `^0.555.0` | Icon library |
| `maplibre-gl` | `^5.17.0` | Interactive map rendering |
| `clsx` | `^2.1.1` | Class name utility |
| `tailwind-merge` | `^3.4.0` | Tailwind class deduplication |

#### State Management
No dedicated state management library (Redux, Zustand, etc.). State is managed via React `useState`/`useEffect` hooks in `src/App.jsx`.

#### API / Data Layer
| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.39.3` | Auth + realtime DB client |
| `pg` | `^8.16.3` | Direct PostgreSQL (server-side pool) |
| `axios` | `^1.6.5` | HTTP requests in workers |
| `body-parser` | `^1.20.2` | Express request parsing |
| `cors` | `^2.8.5` | CORS middleware |
| `helmet` | `^8.1.0` | HTTP security headers |
| `express-rate-limit` | `^8.2.1` | Rate limiting |
| `ajv` | `^8.12.0` | JSON Schema validation |
| `ajv-formats` | `^3.0.1` | AJV format extensions |
| `deep-diff` | `^1.0.2` | Structural diff for data changes |

#### AI / ML Integrations
| Package | Version | Purpose |
|---|---|---|
| `openai` | `^4.24.7` | GPT-4 extraction via `workers/extractor.ts` |

#### Authentication / Authorization
- Supabase Auth (JWT-based, managed) — client-side session
- `x-admin-key` header auth for admin endpoints
- `x-cron-secret` for job endpoints
- Row-Level Security (RLS) enforced at database layer

#### Testing
| Package | Version | Purpose |
|---|---|---|
| `jest` | `^29.7.0` | Test runner |
| `ts-jest` | `^29.1.1` | TypeScript Jest transform |
| `@testing-library/react` | `^16.0.1` | React component testing |
| `@testing-library/jest-dom` | `^6.6.3` | DOM matchers |
| `@testing-library/user-event` | `^14.5.2` | User interaction simulation |
| `supertest` | `^7.1.4` | HTTP endpoint testing |
| `babel-jest` | `^29.7.0` | Babel transform for Jest |

#### Build Tooling
| Package | Version | Purpose |
|---|---|---|
| `vite` | `^7.2.6` | Frontend build |
| `@vitejs/plugin-react` | `^5.1.1` | React fast refresh |
| `ts-node` | `^10.9.2` | TypeScript execution |
| `tsx` | `^4.21.0` | Fast TS runner |
| `nodemon` | `^3.0.3` | Dev auto-reload |
| `concurrently` | `^9.2.0` | Parallel dev scripts |
| `@netlify/functions` | `^5.1.2` | Serverless function SDK |
| `node-pg-migrate` | `^7.6.1` | Migration runner |
| `eslint` | `^8.56.0` | Linting |

#### Other Notable Dependencies
| Package | Version | Purpose |
|---|---|---|
| `typesense` | `^1.7.2` | Full-text search engine client |
| `@mozilla/readability` | `^0.6.0` | Article extraction in fetcher |
| `jsdom` | `^23.2.0` | DOM parsing in fetcher |
| `uuid` | `^9.0.1` | UUID generation |
| `dotenv` | `^16.6.1` | Env var loading |
| `mapshaper` | `^0.6.113` | GeoJSON simplification script |

### 3. Project Structure (2 levels deep)

```
.
├── api/                    # Express HTTP API server (public, admin, jobs endpoints)
│   ├── server.ts           #   App entrypoint, middleware, route registration
│   ├── public.ts           #   Public read endpoints (/public/*)
│   ├── admin.ts            #   Admin review endpoints (/admin/*)
│   ├── jobs.ts             #   Cron-triggered job endpoints (/jobs/*)
│   └── db.ts               #   pg Pool factory for API layer
├── workers/                # Background data pipeline agents
│   ├── fetcher.ts          #   Fetches raw HTML/text from external URLs
│   ├── extractor.ts        #   GPT-4 extracts structured data from fetched content
│   ├── validator.ts        #   JSON Schema validation of extracted data
│   ├── differ.ts           #   Diff engine comparing new vs. existing data
│   ├── editorial_router.ts #   Routes diffs to editorial_reviews queue
│   ├── publisher.ts        #   Applies approved reviews to production tables
│   ├── freshness_scanner.ts#   Flags stale records by TTL policy
│   ├── link_checker.ts     #   Validates source URLs for 404s
│   ├── alert_writer.ts     #   Writes alerts for data state changes
│   ├── supabase_client.ts  #   Service-role Supabase client for workers
│   ├── db.ts               #   pg Pool for workers
│   └── retry.ts            #   Retry utility
├── netlify/functions/      # Serverless functions (privacy API, public countries)
│   ├── _shared/            #   Shared auth, Supabase clients, idempotency utils
│   ├── public-countries.ts #   Serves country GeoJSON data
│   └── v1-privacy-*.ts     #   GDPR: data exports, deletion requests, workers
├── src/                    # React frontend application
│   ├── App.jsx             #   Main app shell and routing (single-file SPA)
│   ├── App.tsx             #   Re-export shim pointing to App.jsx
│   ├── main.jsx            #   React DOM root mount
│   ├── index.css           #   Tailwind + design token CSS
│   ├── components/         #   React components (map, checklist, saved paths, privacy)
│   ├── lib/                #   Frontend utilities (api.js, supabase.js, formatters.js)
│   ├── server/crypto/      #   Server-only AES-256-GCM envelope encryption
│   └── styles/             #   Additional CSS assets
├── supabase/               # Supabase project config and migrations
│   └── migrations/         #   46+ SQL migration files
├── migrations/archive/     # Legacy node-pg-migrate JS migrations
├── search/                 # Typesense search integration
│   ├── schema.json         #   Typesense collection schema
│   └── sync_worker.ts      #   Syncs DB changes → search index
├── infra/                  # Infrastructure config
│   └── cron.yaml           #   Cron schedule definitions (Google Cloud Scheduler format)
├── scripts/                # Utility and backfill scripts
├── tests/                  # Jest test suite
├── docs/                   # Architecture docs, privacy policy, security posture
├── research/               # Research CSVs and snapshot data
├── public/                 # Static assets (SVG/PNG brand marks, GeoJSON)
├── ui/editor/              # Admin editorial review panel UI
├── 20260227_audits/        # Point-in-time audit reports
├── package.json            # Node dependencies and scripts
├── netlify.toml            # Netlify build + redirect + headers config
├── vite.config.ts          # Vite build config
├── jest.config.cjs         # Jest config
├── babel.config.cjs        # Babel config for Jest
├── postcss.config.js       # PostCSS config
└── agents.md               # Agent contract and non-negotiable rules
```

### 4. Architecture Pattern
**JAMstack + Node microservice backend.** Specific pattern:

- **Frontend**: React SPA built by Vite, deployed statically to Netlify CDN. Communicates with both the Express API (for country/visa data) and Supabase directly (for auth and user-owned data).
- **API Layer**: Express server (`api/server.ts`) deployed separately (target URL: `https://api.passagr.com`). Reads from Postgres via `pg` pool.
- **Serverless Functions**: Netlify Functions handle privacy-sensitive operations (data exports, deletion requests, encrypted notes). Avoids cold-start impact on core UX.
- **Background Workers**: Node.js scripts run on schedule (via `infra/cron.yaml`) as cron-triggered HTTP endpoints. Pipeline: `Fetcher → Extractor (GPT-4) → Validator → Differ → Editorial Router → [human review] → Publisher`.
- **Database**: Supabase-managed Postgres with RLS policies. Views (`country_profile_compact`, `country_pathway_summary`) serve as the API query layer. A separate `staging_country_research` table holds unverified AI proposals.
- **Search**: Typesense instance synced on an hourly schedule from Postgres via `search/sync_worker.ts`.

**Data flow (user → DB → user):**
1. User opens SPA → fetches `/public/countries` (Express or Netlify Function) → GeoJSON map renders.
2. User clicks country → `fetchCountryById`, `fetchVisaPaths` called → country detail panel opens.
3. User saves a path → Supabase auth JWT validates → `user_saved_paths` row inserted (RLS enforced).
4. Background: cron fires → freshness scan queues stale countries → fetcher grabs source URLs → extractor runs GPT-4 → diff is computed → editorial review record created → admin approves via `POST /admin/reviews/:id/approve` → publisher writes to `countries`/`visa_paths`.

### 5. Database / Storage Layer

**Database**: Supabase Postgres (managed). **ORM**: None — raw `pg` pool queries server-side, Supabase JS client for user-scoped data.

#### Core Tables

| Table | Key Fields | Purpose |
|---|---|---|
| `countries` | `id`, `name`, `iso2`, `regions[]`, `languages[]`, `currency`, `climate_tags[]`, `healthcare_overview`, `rights_snapshot`, `tax_snapshot`, `lgbtq_rights_index`, `abortion_access_status`, `abortion_access_tier`, `hate_crime_law_snapshot`, `status`, `last_verified_at` | Canonical country data |
| `visa_paths` | `id`, `country_id`, `name`, `type`, `description`, `eligibility` (jsonb), `work_rights`, `min_income_amount`, `min_income_currency`, `min_savings_amount`, `fees` (jsonb), `processing_min_days`, `processing_max_days`, `renewal_rules`, `to_pr_citizenship_timeline`, `status` | Individual visa/residency paths |
| `requirements` | `id`, `visapath_id`, `label`, `details`, `doc_list[]`, `notarization_needed`, `apostille_needed`, `prep_mode` | Per-path document requirements |
| `steps` | `id`, `visapath_id`, `order_int`, `title`, `instructions`, `expected_duration_days`, `links` (jsonb) | Ordered application steps |
| `sources` | `id`, `url`, `title`, `publisher`, `excerpt`, `fetched_at`, `reliability_score` | Verified source documents |
| `cost_items` | `id`, `scope`, `country_id`, `visapath_id`, `label`, `amount`, `currency`, `frequency`, `source_id` | Cost data (fees, living costs) |
| `cities` | `id`, `country_id`, `name`, `tiers[]`, `cost_of_living_index`, `rent_index` | City-level data |
| `changelogs` | `id`, `entity_type`, `entity_id`, `change_type`, `diff_summary`, `diff_fields` (jsonb), `created_by`, `source_ids[]` | Immutable change history |
| `freshness_policies` | `key`, `ttl_days`, `criticality` | Data staleness thresholds |
| `editorial_reviews` | `id`, `entity_type`, `entity_id`, `status`, `proposed_data` (jsonb), `diff_summary`, `diff_fields` (jsonb), `reviewer_uid`, `resolved_at` | AI-proposed changes pending human approval |
| `staging_country_research` | `id`, `iso2`, `payload` (jsonb), `batch_id`, `imported_at` | Raw AI-extracted proposals (pre-review) |

#### Extended Country Tables
| Table | Key Fields | Purpose |
|---|---|---|
| `country_healthcare_metrics` | `country_id`, `system_type`, `public_access_notes` | Healthcare system data |
| `country_tax_profiles` | `country_id`, tax fields | Tax regime details |
| `country_language_profiles` | `country_id`, language fields | Official/spoken languages |
| `country_quality_of_life` | `country_id`, `eiu_liveability` | Quality-of-life index |
| `country_climate_tags` | `country_id`, `tag` | Normalized climate tags |
| `country_languages` | `country_id`, `language` | Normalized language list |
| `country_timezones` | `country_id`, `timezone` | Normalized timezone list |

#### User Tables (RLS-enforced, per-user)
| Table | Key Fields | Purpose |
|---|---|---|
| `user_save_contexts` | `id`, `user_id`, `name`, `description` | Named buckets for saved paths |
| `user_saved_paths` | `id`, `user_id`, `canonical_path_id`, `context_id`, `saved_label` | User bookmarked visa paths |
| `user_saved_path_notes` | `id`, `saved_path_id`, `user_id`, `title`, `body`, `source_url` | Encrypted user notes per saved path |
| `user_path_comparisons` | user-owned comparison sets | Path side-by-side comparison |
| `user_path_comparison_items` | items in a comparison | — |
| `user_path_checklists` | user checklist instances | Per-path application checklists |
| `user_checklist_item_states` | checked/unchecked state | — |
| `user_checklist_timeline_events` | timeline entries | Application progress tracking |

#### Privacy / Compliance Tables
| Table | Purpose |
|---|---|
| `privacy_deletion_requests` | GDPR deletion job queue |
| `privacy_export_jobs` | GDPR export job queue |
| `idempotency_keys` | Prevents duplicate privacy API submissions |
| `user_wrapped_keys` | AES-256-GCM wrapped Data Encryption Keys per user |

#### Database Views (used by API)
- `country_profile_compact` — denormalized country summary for map/list
- `country_pathway_summary` — aggregated visa path counts and types per country

### 6. API Layer

#### Express API (`api/server.ts`, base `https://api.passagr.com`)

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/public/countries` | GET | Returns enriched GeoJSON with country policy data | No |
| `/public/countries/:id` | GET | Returns single country detail | No |
| `/public/countries/:id/sources` | GET | Returns source citations for a country | No |
| `/public/visa-paths` | GET | Lists published visa paths for a `country_id` | No |
| `/public/visa-paths/:id` | GET | Returns full visa path with requirements and steps | No |
| `/public/changelog` | GET | Returns changelog for an entity (`entity_type`, `entity_id`) | No |
| `/admin/reviews/pending` | GET | Lists all `pending` editorial reviews | Yes (`x-admin-key`) |
| `/admin/reviews/:id` | GET | Returns review detail with diff and proposed data | Yes (`x-admin-key`) |
| `/admin/reviews/:id/approve` | POST | Approves a pending editorial review | Yes (`x-admin-key`) |
| `/admin/reviews/:id/reject` | POST | Rejects a pending editorial review | Yes (`x-admin-key`) |
| `/jobs/freshness-scan` | POST | Triggers freshness scan of stale entities | Yes (`x-cron-secret`) |
| `/jobs/link-check` | POST | Triggers link validity check | Yes (`x-cron-secret`) |
| `/jobs/index-refresh` | POST | Triggers Typesense search index sync | Yes (`x-cron-secret`) |

#### Netlify Serverless Functions

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/public/countries` | GET | Country GeoJSON overlay (Netlify variant) | No |
| `/v1/privacy/exports` | POST | Create GDPR data export job | Supabase JWT |
| `/v1/privacy/exports/:job_id` | GET | Get export job status and download URL | Supabase JWT |
| `/v1/privacy/deletion-requests` | POST | Submit account deletion request | Supabase JWT |
| `/v1/privacy/deletion-requests/:id` | GET | Get deletion request status | Supabase JWT |
| `/v1/privacy/deletion-requests/:id/cancel` | POST | Cancel a pending deletion request | Supabase JWT |
| `/v1/saved-path-notes` | GET / POST | List or create encrypted path notes | Supabase JWT |
| `/v1/saved-path-notes/:id` | GET / PATCH / DELETE | Read, update, or delete a note | Supabase JWT |

### 7. External Service Integrations

| Service | SDK/Package | Purpose |
|---|---|---|
| **Supabase** | `@supabase/supabase-js` | Managed Postgres, Auth (JWT), Storage (privacy exports), RLS |
| **OpenAI GPT-4** | `openai` | AI extraction of structured immigration data from raw web content |
| **Typesense** | `typesense` | Full-text search index for countries and visa paths |
| **Netlify** | `@netlify/functions`, `netlify.toml` | Frontend CDN, serverless function hosting, build pipeline |
| **Google Cloud Scheduler** (inferred) | `infra/cron.yaml` | Scheduled triggering of API job endpoints |

### 8. AI / ML Components

**Provider**: OpenAI (GPT-4-turbo via `workers/extractor.ts`)

**What it does**: The extractor worker takes a URL's fetched content (text excerpt) and a target JSON schema (for `country` or `visa_path` entity types), then calls GPT-4 with `temperature: 0` and `response_format: { type: "json_object" }` to extract structured data. The prompt instructs the model to:
- Extract only what is explicitly present in the provided text
- Return `null` / empty arrays for missing fields
- Include field-level source citations back to the original text

**Prompt structure** (summarized — not reproduced in full): System message: "You are a helpful assistant that extracts structured data from text. Respond with only JSON." User message includes the entity schema, fetched text content, and source URL.

**Post-processing**: Extracted JSON is passed to `validator.ts` (JSON Schema via AJV), then to `differ.ts` (structural diff against existing DB record), then to `editorial_router.ts` which creates an `editorial_reviews` record. A human must approve before `publisher.ts` applies the change to production tables. AI output is **never published automatically**.

### 9. Authentication and Authorization Model

| Layer | Mechanism |
|---|---|
| **End user auth** | Supabase Auth — email/password or OAuth (SSO providers not explicitly configured in code). JWT issued by Supabase. |
| **Frontend ↔ Supabase** | Anon key (`VITE_SUPABASE_ANON_KEY`) for public reads; user JWT for authenticated writes |
| **Frontend ↔ API** | No explicit user auth on public endpoints; access token passed for saved-path notes |
| **Netlify Functions** | `verifySupabaseUser()` validates Bearer JWT via Supabase `auth.getUser()` |
| **Admin endpoints** | `x-admin-key` header (static API key, server env var) |
| **Cron/job endpoints** | `x-cron-secret` header (static secret, server env var) |
| **Database** | Row-Level Security (RLS) on all user-owned tables; `auth.uid()` enforced at Postgres level |
| **Encryption** | Per-user AES-256-GCM envelope encryption for `user_saved_path_notes`; DEKs are user-wrapped and stored in `user_wrapped_keys` |

**Permission levels:**
- **Anonymous** — read published countries, visa paths, changelogs
- **Authenticated user** — save paths, manage notes (RLS restricts to own data only)
- **Admin** — approve/reject editorial reviews (API key auth)
- **System/Cron** — trigger background jobs (cron secret auth)

### 10. Environment Variables

#### Database / Supabase
- `DATABASE_URL` — PostgreSQL connection string (server-side)
- `SUPABASE_URL` — Supabase project URL (server-side workers)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `SUPABASE_ANON_KEY` — Supabase anon key (server-side API)
- `VITE_SUPABASE_URL` — Supabase URL (client-side, Vite-exposed)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (client-side, Vite-exposed)

#### API Server
- `PORT` — Express server port (default: 4311)
- `CORS_ORIGIN` — Allowed origin for CORS (required)
- `ADMIN_API_KEY` — Static key for admin endpoints (required)
- `CRON_SECRET` — Static secret for job endpoints (required)
- `REQUEST_TIMEOUT_MS` — Request timeout (default: 15000)
- `ADMIN_RATE_LIMIT` — Admin endpoint rate limit (default: 60 req/window)
- `ADMIN_RATE_WINDOW_MS` — Admin rate limit window (default: 60000ms)
- `PUBLIC_RATE_LIMIT` — Public endpoint rate limit (default: 120 req/window)
- `PUBLIC_RATE_WINDOW_MS` — Public rate limit window (default: 60000ms)

#### Worker Config
- `FETCH_TIMEOUT_MS` — External fetch timeout (default: 15000)
- `MAX_FETCH_BYTES` — Max response body size (default: 10MB)
- `ALLOW_INSECURE_HTTP` — Allow non-HTTPS URLs (default: false)

#### Database Pool (API)
- `PG_MAX_CONNECTIONS`
- `PG_IDLE_TIMEOUT_MS`
- `PG_QUERY_TIMEOUT_MS`
- `PG_STATEMENT_TIMEOUT_MS`

#### Encryption
- `ENVELOPE_MASTER_KEY` — Master key for DEK wrapping (server only)
- `ENVELOPE_MASTER_KEY_SALT`
- `ENVELOPE_MASTER_KEY_KDF_ITERATIONS`
- `ENVELOPE_KMS_ADAPTER`

#### Search
- `TYPESENSE_HOST`
- `TYPESENSE_PORT`
- `TYPESENSE_PROTOCOL`
- `TYPESENSE_API_KEY`

#### Frontend Build
- `VITE_API_BASE_URL` — API server base URL (client-side)
- `VITE_MAP_DEBUG` — Enable map debug overlay (default: false)

#### Cache Tuning (API)
- `COUNTRIES_CACHE_MS` — Countries endpoint cache TTL (default: 30000)
- `SOURCES_CACHE_MS` — Sources endpoint cache TTL (default: 120000)

---

## SECTION 3: FEATURE INVENTORY

| Feature | User-Facing Description | Completeness | Key Files | Dependencies |
|---|---|---|---|---|
| **Interactive World Map** | Browse countries on a MapLibre GL map; countries are color-coded by visa path availability, LGBTQ rights index, and safety indicators | `Functional` | `src/components/ImmigrationMap.jsx`, `src/App.jsx`, `api/public.ts`, `public/countries.geojson` | Country data published in DB, GeoJSON base map |
| **Country Detail Panel** | View country-level immigration snapshot including rights, healthcare, tax overview, and pathway types | `Functional` | `src/App.jsx`, `api/public.ts` | Countries table (published rows) |
| **Visa Path Browser** | Browse available visa/residency paths for a country with descriptions and eligibility | `Functional` | `src/App.jsx`, `api/public.ts` | `visa_paths`, `requirements`, `steps` |
| **Source Citations** | View source URLs and reliability metadata that back each country's data | `Functional` | `api/public.ts` (`getCountrySources`), `staging_country_research` table | Staging table populated by pipeline |
| **Changelog Viewer** | See when and what changed for a country or visa path | `Partial` | `api/public.ts` (`getChangelog`), `changelogs` table | Changelog entries written by publisher |
| **Save a Visa Path** | Authenticated users can bookmark visa paths into named "contexts" | `Functional` | `src/components/SavedPathsPage.jsx`, `src/lib/api.js`, Supabase `user_saved_paths` | Supabase Auth |
| **Path Checklist** | Interactive checklist of document requirements and steps for a saved path | `Functional` | `src/components/PathChecklistExperience.jsx`, `src/components/VisaPathChecklist.jsx` | Saved path, user checklist tables |
| **Path Comparison** | Side-by-side comparison of saved paths | `Scaffolded` | `user_path_comparisons`, `user_path_comparison_items` tables | Save a Path |
| **Encrypted Notes** | Users can add private, end-to-end-encrypted notes to saved paths | `Functional` | `netlify/functions/v1-saved-path-notes.ts`, `src/server/crypto/envelope.ts`, `user_saved_path_notes` | User auth, `user_wrapped_keys` |
| **Privacy Data Export (GDPR)** | Request a full download of your personal data in JSON format | `Functional` | `netlify/functions/v1-privacy-exports-*.ts`, `netlify/functions/_shared/` | Supabase Storage, all user tables |
| **Account Deletion (GDPR)** | Request permanent deletion of all personal data | `Functional` | `netlify/functions/v1-privacy-deletion-requests-*.ts`, `v1-privacy-deletion-worker.ts` | All user tables, idempotency keys |
| **Privacy Settings Page** | View privacy policy and initiate export/deletion | `Partial` | `src/components/PrivacyPage.jsx` | Privacy API endpoints |
| **Editorial Review Pipeline** | AI-extracted data proposals queue for human review before publishing | `Functional` | `workers/extractor.ts`, `workers/differ.ts`, `workers/editorial_router.ts`, `workers/publisher.ts`, `api/admin.ts` | OpenAI, `editorial_reviews` table |
| **Admin Review Panel** | Admin UI to approve or reject pending editorial reviews | `Partial` | `ui/editor/ReviewPanel.tsx`, `api/admin.ts` | Editorial pipeline |
| **Freshness Scanning** | Automatic detection of stale data based on TTL policies | `Functional` | `workers/freshness_scanner.ts`, `freshness_policies` table | Cron schedule |
| **Link Checking** | Periodic validation that source URLs are still live | `Functional` | `workers/link_checker.ts` | Sources table |
| **Search** | Full-text search across countries and visa paths via Typesense | `Partial` | `search/sync_worker.ts`, `search/schema.json` | Typesense instance, sync pipeline |
| **Legal Matching (Sprint 1)** | Schema and RLS for legal aid matching feature | `Scaffolded` | Migration `20260206110000_legal_match_sprint1_schema.sql` | — |

---

## SECTION 4: DESIGN SYSTEM & BRAND

### 1. Color Palette

Defined in `src/index.css` via Tailwind `@theme` and CSS custom properties:

| Token | Hex / Value | Where Defined |
|---|---|---|
| `--color-ink` | `#24272a` | `src/index.css` |
| `--color-ivory` | `#f2ede531` (31% opacity) | `src/index.css` |
| `--color-accent` | `#305969` | `src/index.css` |
| `--color-charcoal` | `#656663` | `src/index.css` |
| `--color-grey` | `#9b9a94` | `src/index.css` |
| `--color-green` | `#2ec4b6` | `src/index.css` |
| `--color-red` | `#e71d36` | `src/index.css` |
| `--color-yellow` | `#ff9f1c` | `src/index.css` |
| `--color-surface-100` | `#f2efec` | `src/index.css` |
| `--color-surface-200` | `#d9d4cf` | `src/index.css` |
| `--color-surface-300` | `#bfb7b0` | `src/index.css` |
| `--color-surface-400` | `#9f958f` | `src/index.css` |
| `--color-surface-500` | `#7f7670` | `src/index.css` |
| `--color-surface-600` | `#5f5751` | `src/index.css` |
| `--color-surface-700` | `#3f3a36` | `src/index.css` |
| `--color-surface-800` | `#1f1c1a` | `src/index.css` |

> Note: `docs/README.md` references a slightly different set of brand color names (`#F3F4E6` Base Light, `#4E808D` Passage Teal, `#C7A76A` Port Gold, `#0F1214` Ink) — likely an older version of the brand spec. The `src/index.css` values are the authoritative implementation.

### 2. Typography

Fonts loaded (referenced in CSS):
- **`Playfair Display`** — serif, assigned to `--font-serif` / heading elements
- **`Inter`** — sans-serif, assigned to `--font-sans` / body default

Type scale: Tailwind defaults with Tailwind `@theme` overrides. Custom heading styles applied via `@layer base` in `src/index.css`.

### 3. Component Library

No external component library (e.g., Shadcn, MUI). Custom components in `src/components/`:

| Component | Description |
|---|---|
| `ImmigrationMap.jsx` | MapLibre GL interactive world map with country-layer overlays and popup panels |
| `MapErrorBoundary.jsx` | React error boundary for map rendering failures |
| `PathChecklistExperience.jsx` | Multi-step checklist flow for tracking visa application progress |
| `VisaPathChecklist.jsx` | Interactive check-item list for document requirements and steps |
| `SavedPathsPage.jsx` | Full page for viewing, managing, and comparing bookmarked visa paths |
| `PrivacyPage.jsx` | GDPR settings page — export/deletion request UI |
| `PassagrMarks.jsx` | SVG brand mark components (wordmark, lockup, glyph) |
| `GhostTextLayer.tsx` | Loading skeleton / ghost text overlay for async states |
| `ui/editor/ReviewPanel.tsx` | Admin editorial review panel for approving/rejecting proposed changes |

### 4. Design Language
Editorial and understated — muted earth tones (ivory, charcoal, ink), with teal (`#305969`) as the primary interactive color and semantic signal colors (green/teal for positive, yellow for caution, red for warning). Playfair Display serif headings signal trust and authority; Inter body text for readability. Overall aesthetic: data-serious, newspaper-editorial, safety-first.

### 5. Responsive Strategy
Tailwind CSS utility classes with responsive prefixes (`md:`, `lg:`). The docs describe mobile-first design with minimum 48×48px touch targets and responsive font sizing. MapLibre handles its own responsive scaling.

### 6. Dark Mode
Not implemented. `[NOT FOUND IN CODEBASE]` — docs note dark mode as a future enhancement.

### 7. Brand Assets

Located in `public/` and root:
- `public/passagr_wordmark.svg` / `.png`
- `public/passagr_glyph.svg` / `.png`
- `public/passagr_lockup.svg` / `.png`
- `greyscale_passagr.png`
- `passagr_accents_.png`

---

## SECTION 5: DATA & SCALE SIGNALS

### 1. User Model

**Data stored per user** (all RLS-enforced, user_id = `auth.uid()`):
- Save contexts (named buckets)
- Saved paths (bookmarked visa paths with labels)
- Saved path notes (encrypted, per-path)
- Path comparisons and comparison items
- Checklists and checklist item states
- Timeline events
- Wrapped DEK for envelope encryption

**User journey from signup to value:**
1. **Anonymous**: browse map → view countries and visa paths (no sign-in needed)
2. **Sign up** (Supabase email/OAuth)
3. **Save a path** → path appears in "Saved Paths" page
4. **Add to checklist** → interactive progress tracking per visa application
5. **Add private notes** → encrypted notes attached to saved path
6. **Request export** (optional GDPR) → JSON of all personal data
7. **Account deletion** (optional GDPR) → all user rows deleted

### 2. Content / Data Volume

- **Countries**: 46+ SQL migration files include published snapshots for ~15–20 specific countries (Portugal, Spain, Argentina, Mexico, Uruguay, Canada, Japan, Thailand, Ireland, UK, France, Germany, Netherlands, Australia, Costa Rica, New Zealand, Italy).
- **Seed files**: `seed_data.ts`, `seed_data.js`, `seed_api.js`, `supabase/seed/seed_matching_destinations.ts` exist for development/testing.
- **Research CSVs**: `research/` contains CSVs for liveability, healthcare, taxes, safety/autonomy, language — suggests moderate data set.
- System seems designed for O(100–200) countries, O(1000s) visa paths. No evidence of sharding or horizontal scaling.

### 3. Performance Considerations

| Mechanism | Implementation |
|---|---|
| **In-memory caching** | `/public/countries` response cached for 30s; `/public/countries/:id/sources` per-ISO2 cached for 120s (server-side `Map`) |
| **Request timeout** | 15s default on all Express requests |
| **Rate limiting** | 120 req/min public; 60 req/min admin (in-memory `Map`, auto-pruned) |
| **Database indexes** | Indexes on `country_id`, `status`, `visapath_id`, GIN indexes on array columns, composite indexes on `editorial_reviews.status` |
| **GeoJSON** | Pre-simplified via `mapshaper` (script exists); served as a static file enriched with DB data |
| **Response body limit** | Fetcher caps at 10MB per external source |
| **Lazy loading** | No explicit code splitting beyond Vite defaults |
| **Pagination** | `[NOT FOUND]` — public list endpoints do not appear to paginate (potential scale risk) |

### 4. Analytics / Tracking

`[NOT FOUND IN CODEBASE]` — No analytics integration (no Google Analytics, Segment, Mixpanel, PostHog, etc.) detected in the frontend or API. `docs/README.md` mentions analytics as an optional future add-on with a commented-out snippet.

### 5. Error Handling

- **API**: `try/catch` around all async handlers; returns `{ error: "..." }` JSON with appropriate HTTP status codes (400, 401, 404, 429, 500, 503).
- **Frontend**: `MapErrorBoundary.jsx` wraps the map component. `src/lib/api.js` has a `withTimeout` wrapper. Error states shown in UI (no visible error reporting service).
- **Workers**: `withRetry()` utility in `workers/retry.ts`; errors logged to console.
- **No external error monitoring** (Sentry, Bugsnag, etc.) detected.

### 6. Testing

| Test File | Coverage |
|---|---|
| `tests/formatters.test.ts` | Unit tests for `formatters.js` string utilities (43 lines) |
| `tests/admin.test.ts` | Unit tests for admin API handler functions (104 lines) |
| `tests/jobs.test.ts` | Unit tests for jobs API handler functions (77 lines) |
| `tests/public_api.test.ts` | **Disabled** (`describe.skip`) — public API integration tests blocked by mocking issues with `pg Pool` (64 lines) |
| `tests/api.test.ts` | Stub — 9 lines, references disabled tests |
| `tests/e2e-app.test.tsx` | E2E app tests using React Testing Library (165 lines) |
| `tests/setup.ts` | Jest test setup (47 lines) |

**Test runner**: Jest with `ts-jest`. **Total test coverage**: Partial — core API handlers and formatters tested; integration tests for public API are disabled; no worker pipeline tests visible.

---

## SECTION 6: MONETIZATION & BUSINESS LOGIC

### 1. Pricing / Tier Structure
`[NOT FOUND IN CODEBASE]` — No pricing tiers, plan definitions, or feature gates exist in any code file.

### 2. Payment Integration
`[NOT FOUND IN CODEBASE]` — No Stripe, PayPal, or other payment processor integration.

### 3. Subscription / Billing Logic
`[NOT FOUND IN CODEBASE]`

### 4. Feature Gates
`[NOT FOUND IN CODEBASE]` — All features appear accessible to any authenticated user. No plan-based restrictions are implemented.

### 5. Usage Limits
Rate limiting exists at the API layer (120 req/min public, 60 req/min admin) but is infrastructure-level, not user-level. No per-user quotas or credit systems.

> **Note**: The product currently appears to be a free tool with no monetization layer implemented.

---

## SECTION 7: CODE QUALITY & MATURITY SIGNALS

### 1. Code Organization
Strong separation of concerns:
- **API layer** (`api/`) — HTTP routing and handlers
- **Worker layer** (`workers/`) — background pipeline agents, each in its own file
- **Frontend** (`src/`) — React UI, cleanly separated from server code
- **Serverless** (`netlify/functions/`) — privacy-specific operations isolated to serverless context
- **Shared utilities** (`workers/supabase_client.ts`, `api/db.ts`, `netlify/functions/_shared/`) — no cross-layer leakage

The module manifest (`module_manifest.md`) is an active artifact that documents every file by domain and type.

### 2. Patterns and Conventions

| Pattern | Usage |
|---|---|
| **Allowlist for table names** | `getTableName()` in `api/admin.ts` uses a strict `tableMap` to prevent SQL injection |
| **Handler pattern** | Workers expose a `handler()` async function; composed via direct imports |
| **Enum validation** | `VALID_ENTITY_TYPES` Set guards the changelog endpoint |
| **Retry utility** | `workers/retry.ts` — `withRetry()` wraps async operations |
| **In-memory cache** | Per-endpoint Maps in `api/public.ts` for short-lived response caching |
| **Envelope encryption** | Per-user DEK wrapping via AES-256-GCM in `src/server/crypto/envelope.ts` |
| **Idempotency keys** | Privacy API uses `idempotency_keys` table to prevent duplicate submissions |
| **RLS everywhere** | All user tables have `auth.uid()` enforced at Postgres level |

Naming conventions: camelCase for TS/JS functions and variables, snake_case for DB columns, kebab-case for file names in `netlify/functions/`. Consistent and readable.

### 3. Documentation

- `docs/README.md` — comprehensive architecture overview, deployment options, design philosophy
- `docs/QUICKSTART.md` — developer quickstart
- `docs/data-lifecycle.md` — data lifecycle documentation
- `docs/security-posture.md` — security model documentation
- `docs/privacy.md` — privacy policy
- `docs/SAFETY_FIRST_OUTPUT_FRAMING.md` — AI output framing guidelines
- `agents.md` — agent contract (non-negotiable rules for AI agents)
- `module_manifest.md` — complete file-by-file manifest with domains and complexity ratings
- `20260227_audits/` — 7 point-in-time audit reports (DB, API security, pipeline, frontend, search, tests, privacy/compliance)
- Inline comments in API files are thorough; worker files have moderate comments.

### 4. TypeScript Usage

Mixed: backend workers and API are `.ts`; frontend components are mostly `.jsx` (not `.tsx`), with `src/App.tsx` being a thin shim. `src/server/crypto/envelope.ts` and `ui/editor/ReviewPanel.tsx` are strict TypeScript.

- **`any` types**: Present in `api/public.ts` (`let baseGeoJson: any`), GeoJSON feature mapping, and `workers/extractor.ts` extracted JSON handling.
- **Interfaces**: Well-defined where used (e.g., `ExtractorTask`, `FetcherTask`, `EncryptedPayload`, `WrappedKeyRow` in crypto module).
- **Strictness**: `tsconfig.json` not reproduced here but moderate strictness inferred from mixed `.jsx`/`.tsx` usage.

### 5. Error Handling Patterns

- **API**: Consistent `try/catch` on all async handlers; structured `{ error: string }` JSON responses.
- **Startup guards**: `api/server.ts` checks for required env vars and calls `process.exit(1)` if missing.
- **Workers**: `withRetry()` for transient failures; errors logged to `console.error`.
- **Frontend**: `MapErrorBoundary` for map; `withTimeout` for API calls. No user-facing error reporting beyond inline UI states.
- **No custom error classes** — errors are caught and re-thrown as strings.

### 6. Git Hygiene

- Repository was cleaned with `clean_history.sh` (present in root) — original commit history squashed.
- Only 2 commits visible in this shallow clone.
- `[NOT FOUND — branching strategy and PR history not recoverable from this clone]`

### 7. Technical Debt Flags

| Location | Issue |
|---|---|
| `api/admin.ts`, `approveReview` | `TODO: Trigger Publisher agent with approved data` — approval does not yet trigger the publisher |
| `api/public.ts` | `let baseGeoJson: any` — untyped |
| `workers/extractor.ts` | File contains scaffolding comments (`// ... (Rest of the Extractor.ts file remains the same...)`), indicating the file is partially stubbed |
| `schema.txt` | ⚠️ **CRITICAL SECURITY**: File contains misplaced content (AI image prompts) and an **exposed third-party API key**. The file is not the DB schema it is named for. |
| `tests/public_api.test.ts` | Explicitly disabled with `describe.skip` — integration test coverage gap |
| `src/App.jsx` + `src/App.tsx` | Dual-file shim pattern adds unnecessary indirection |
| Various | Mix of `.jsx`/`.tsx` — TypeScript coverage is inconsistent on the frontend |
| `api/admin.ts` | `reviewer_uid` hardcoded to `'admin'` string — does not capture actual reviewer identity |

### 8. Security Posture

| Control | Status |
|---|---|
| CORS enforcement | ✅ Strict — `CORS_ORIGIN` env var required; server exits if missing |
| Helmet headers | ✅ Applied globally via `helmet()` |
| Content security headers | ✅ `netlify.toml` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| SQL injection prevention | ✅ Parameterized queries throughout; table name allowlist in admin routes |
| Rate limiting | ✅ In-memory rate limits on public and admin endpoints |
| Auth enforcement | ✅ RLS at DB layer; JWT verification in Netlify Functions; API key for admin/jobs |
| Envelope encryption | ✅ Per-user AES-256-GCM DEK wrapping for notes |
| SSRF protection | ✅ Fetcher blocks private IPs, local hostnames, non-HTTPS (configurable) |
| Input validation | ✅ `VALID_ENTITY_TYPES` allowlist; AJV schema validation in worker pipeline |
| Request timeout | ✅ 15s default on all requests |
| Secrets in code | ⚠️ **`schema.txt` contains a plaintext third-party API key** — see technical debt |
| Error message leakage | ⚠️ Worker errors logged to console; no sanitization of internal error details in API 500 responses |

---

## SECTION 8: ECOSYSTEM CONNECTIONS

### 1. Shared Code or Patterns with Penny Lane Portfolio

The `agents.md` file defines a shared **Agent Contract** that likely applies across Penny Lane projects. It describes:
- Accuracy over completeness
- Evidence over inference
- Human-in-the-loop approval before publishing
- No external knowledge / no hallucination

This contract pattern is documented as reusable architecture for The Penny Lane Project portfolio (Relevnt, Codra, Ready, Mythos, embr, Passagr, Advocera).

`[NOT FOUND IN CODEBASE — cross-project shared library imports or shared component packages not detected]`

### 2. Shared Dependencies or Infrastructure

- **Supabase**: Uses a dedicated Supabase project instance (credentials are env vars, not shared in code). Cannot confirm whether this is the same Supabase org as other portfolio projects from the codebase alone.
- **Netlify**: Dedicated Netlify site (inferred from `netlify.toml`). Shared account unknown.
- **OpenAI**: Same API pattern as likely used in other AI-assisted portfolio projects.

`[CANNOT CONFIRM from codebase alone whether infrastructure is shared with other projects]`

### 3. Data Connections

No evidence of cross-project data reads/writes in the codebase.

### 4. Cross-References

No imports, links, or references to sister projects detected in any source file.

---

## SECTION 9: WHAT'S MISSING (CRITICAL)

### 1. Gaps for Production-Ready Product

| Gap | Severity | Notes |
|---|---|---|
| **Publisher not wired to approvals** | High | `POST /admin/reviews/:id/approve` logs a TODO but does not invoke `publisher.ts` |
| **No pagination** on list endpoints | High | `getCountries` and `getVisaPaths` return all rows — will fail at scale |
| **No error monitoring** | High | No Sentry/Bugsnag; silent failures in workers have no alerting |
| **No analytics** | Medium | No instrumentation for user behavior or funnel metrics |
| **Search not integrated in UI** | Medium | Typesense sync exists but no search UI is visible in `src/App.jsx` |
| **Admin review UI incomplete** | Medium | `ui/editor/ReviewPanel.tsx` exists but integration with live admin workflow unclear |
| **Path comparison UI** | Medium | Tables exist, no frontend implementation found |
| **Dark mode** | Low | Noted as future work |
| **No email notifications** | Medium | No SendGrid/Mailgun for deletion confirmations, export delivery, etc. |
| **Legal matching feature** | Low | Schema exists (Sprint 1 migration) but no UI or backend logic |

### 2. Gaps for Investor Readiness

| Gap | Notes |
|---|---|
| **No monetization layer** | No pricing, plans, or payment processing |
| **No analytics or metrics** | Cannot demonstrate MAU, DAU, session depth, or conversion |
| **No live user count or growth data** | No telemetry in codebase |
| **No uptime monitoring** | No StatusPage or uptime SLA evidence |
| **No onboarding flow** | User sign-up path not documented or tested |
| **Business model undefined** | Product is fully free; revenue model unclear |
| **Missing competitive positioning** | Research docs exist but no market analysis in repo |

### 3. Gaps in the Codebase Itself

| Gap | Notes |
|---|---|
| **`schema.txt`** | Contains misplaced content and an **exposed third-party API key** — must be remediated immediately |
| **`tests/public_api.test.ts`** | Explicitly disabled — integration test coverage gap for most-used endpoints |
| **`workers/extractor.ts`** | File contains scaffolded stubs (`// ... (Rest of the Extractor.ts file remains the same...)`) — incomplete |
| **`approveReview` TODO** | Publisher not triggered on review approval — pipeline is broken end-to-end |
| **`reviewer_uid` hardcoded** | Always writes `'admin'` — no audit trail of which human approved changes |
| **GeoJSON path hardcoded** | `api/public.ts` references `data/ne_admin_0_countries.geojson` which does not appear in the checked-in `public/` directory |
| **Duplicate seed files** | `seed_data.js`, `seed_data.ts`, `seed_api.js` at root with overlapping purpose |
| **`.DS_Store` files** | Present in `ui/`, `workers/`, `tests/` — should be in `.gitignore` |
| **`dist/` committed** | Build artifacts (`dist/`) appear checked in — should be in `.gitignore` |

### 4. Recommended Next Steps (Priority Order)

1. **🔴 Remediate exposed API key in `schema.txt`** — Rotate the key immediately, remove it from the file, and add `schema.txt` cleanup or rotation to the security runbook. Also audit git history for other credential exposures.

2. **🔴 Wire `approveReview` → `publisher.ts`** — The editorial pipeline is broken at its final step. Approved reviews do not update production data. This is the most critical functional gap: the entire AI-review-publish loop is disconnected.

3. **🟡 Add pagination to list endpoints** — `getCountries` and `getVisaPaths` SELECT all rows without LIMIT/OFFSET. This is a time bomb as data grows; add cursor-based pagination before any significant data scale.

4. **🟡 Enable and fix `tests/public_api.test.ts`** — The most-used endpoints (countries, visa paths) have no active integration tests. Fix the `pg Pool` mocking issue and re-enable these tests to prevent regressions.

5. **🟡 Add error monitoring** — Integrate Sentry (or equivalent) into both the Express API and Netlify Functions. Silent worker failures and unhandled promise rejections in production are invisible without this.

---

## SECTION 10: EXECUTIVE SUMMARY

**Paragraph 1 — What This Is**
Passagr is an AI-assisted, human-reviewed immigration intelligence platform designed for people researching international relocation. It solves a real and underserved problem: immigration policy data is fragmented, rapidly changing, and inconsistently presented across government websites and forums. Passagr aggregates, verifies, and publishes structured immigration data — visa paths, document requirements, rights snapshots (LGBTQ, reproductive), and healthcare and tax overviews — for a growing list of destination countries, presented through an interactive world map and a guided checklist experience.

**Paragraph 2 — Technical Credibility**
The technical foundation is sophisticated for an early-stage product. Passagr implements a complete, human-gated AI data pipeline: GPT-4 extracts structured data from web sources, a diff engine compares proposals to existing records, and an editorial review system requires human approval before any change reaches production. The database layer uses Supabase with row-level security enforced at the Postgres level — not just in application code — across all user-owned tables. Privacy is a first-class concern: GDPR data export and deletion workflows are implemented as serverless functions with idempotency keys, and user notes are protected with AES-256-GCM envelope encryption using per-user wrapped DEKs. The codebase demonstrates clear architectural separation of concerns, a documented agent contract, multiple in-depth self-audits, and thoughtful security controls (SSRF protection in the fetcher, CORS enforcement, Helmet headers, rate limiting). This is not scaffolding — it is a working system with real data in production.

**Paragraph 3 — Honest Assessment and Next Milestone**
The product is in Alpha: core features work end-to-end, data is live, and a handful of countries are published. The critical gap is that the AI-review-publish loop is broken at its final step — approved editorial reviews do not yet trigger the publisher, meaning the data pipeline cannot complete without manual intervention. There is also an exposed API key in `schema.txt` that requires immediate remediation. To reach Beta, the team needs to: close the publisher integration gap, add pagination to list endpoints, re-enable disabled integration tests, and wire up error monitoring. To reach investor readiness, Passagr needs a monetization hypothesis, user analytics instrumentation, and a measurable user base. The technical bones are strong; the primary near-term work is closing the last mile of the pipeline and instrumenting the product for growth.

---

```
---
AUDIT METADATA
Project: Passagr (passagr-backend)
Date: 2026-03-07
Agent: GitHub Copilot (GPT-4.5 / Claude Sonnet)
Codebase access: full repo (shallow clone — 2 commits visible, history was squashed)
Confidence level: high — all findings are directly sourced from codebase files; 
  inferences are explicitly flagged. Items marked [NOT FOUND] were not present in 
  any reviewed file.
Sections with gaps: 
  - Section 1 (commit history squashed, live frontend URL not found)
  - Section 6 (no monetization layer implemented)
  - Section 8 (cross-project connections not verifiable from single repo)
Total files analyzed: ~130 (of 221 total files; node_modules and .git excluded)
---
```
