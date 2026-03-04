# Codebase Module Manifest

## 1. The Full Manifest

| Path / Group | Domain | Type | Description | Complexity |
|---|---|---|---|---|
| [api/server.ts](file:///Users/sarahsahl/Desktop/passagr/api/server.ts) | API | service | Main entry point for the internal/dedicated API server | Medium |
| [api/admin.ts](file:///Users/sarahsahl/Desktop/passagr/api/admin.ts) | API | route | Admin API endpoints and logic | Medium |
| [api/jobs.ts](file:///Users/sarahsahl/Desktop/passagr/api/jobs.ts) | API | route | API endpoints for triggering and managing jobs | Medium |
| [api/public.ts](file:///Users/sarahsahl/Desktop/passagr/api/public.ts) | API | route | Public-facing API endpoints | Medium |
| [api/db.ts](file:///Users/sarahsahl/Desktop/passagr/api/db.ts) | API | util | Database connection/client for the API | Low |
| [src/server/crypto/envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts) | Privacy / API | util | Encryption and decryption logic for sensitive user data | High |
| `netlify/functions/v1-privacy-deletion-requests-*` | Privacy | route | API routes for creating, canceling, and getting deletion requests | High |
| [netlify/functions/v1-privacy-deletion-worker.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts) | Privacy | service | Background worker for processing user data deletion | High |
| `netlify/functions/v1-privacy-exports-*` | Privacy | route/service | API routes and worker for exporting user data | High |
| `netlify/functions/_shared/*` | API | util | Shared logic, auth routines, and DB clients for serverless functions | Medium |
| [netlify/functions/public-countries.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/public-countries.ts) | API | route | Serverless endpoint serving public country data | Low |
| [workers/fetcher.ts](file:///Users/sarahsahl/Desktop/passagr/workers/fetcher.ts) | Data Ingestion | service | Fetches external data sources | Medium |
| [workers/extractor.ts](file:///Users/sarahsahl/Desktop/passagr/workers/extractor.ts) | Data Ingestion | service | Extracts and normalizes data from raw fetched sources | Medium |
| [workers/validator.ts](file:///Users/sarahsahl/Desktop/passagr/workers/validator.ts) | Data Ingestion | service | Validates extracted data against defined schemas | Medium |
| [workers/differ.ts](file:///Users/sarahsahl/Desktop/passagr/workers/differ.ts) | Data Ingestion | service | Compares fresh data with existing data to detect logical changes | High |
| [workers/editorial_router.ts](file:///Users/sarahsahl/Desktop/passagr/workers/editorial_router.ts) | Data Ingestion | service | Routes diffs to editorial review before publishing | High |
| [workers/publisher.ts](file:///Users/sarahsahl/Desktop/passagr/workers/publisher.ts) | Data Ingestion | service | Publishes approved editorial changes to production | High |
| [workers/freshness_scanner.ts](file:///Users/sarahsahl/Desktop/passagr/workers/freshness_scanner.ts) | Data Ingestion | service | Scans for stale data that needs to be refreshed | Medium |
| [workers/link_checker.ts](file:///Users/sarahsahl/Desktop/passagr/workers/link_checker.ts) | Data Ingestion | service | Checks the validity of external links in the database | Medium |
| [workers/alert_writer.ts](file:///Users/sarahsahl/Desktop/passagr/workers/alert_writer.ts) | Data Ingestion | service | Background job to write alerts based on data changes or states | Medium |
| [workers/db.ts](file:///Users/sarahsahl/Desktop/passagr/workers/db.ts), [workers/supabase_client.ts](file:///Users/sarahsahl/Desktop/passagr/workers/supabase_client.ts) | Data Ingestion | util | Database connection utilities specifically for workers | Low |
| [search/sync_worker.ts](file:///Users/sarahsahl/Desktop/passagr/search/sync_worker.ts) | Search | service | Synchronizes changes from the database to the search index | Medium |
| [search/schema.json](file:///Users/sarahsahl/Desktop/passagr/search/schema.json) | Search | schema | Definition of the search index schema | Low |
| [src/App.jsx](file:///Users/sarahsahl/Desktop/passagr/src/App.jsx), [src/App.tsx](file:///Users/sarahsahl/Desktop/passagr/src/App.tsx), [src/main.jsx](file:///Users/sarahsahl/Desktop/passagr/src/main.jsx) | UI | component | Main application entry points, initialization, and routing | Medium |
| [src/components/ImmigrationMap.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx) | UI | component | Interactive map visualization for immigration options | High |
| [src/components/PathChecklistExperience.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx) | UI | component | Core user experience flow for building/viewing immigration checklists | High |
| [src/components/VisaPathChecklist.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/VisaPathChecklist.jsx) | UI | component | Interactive checklist governing visa requirements | High |
| [src/components/SavedPathsPage.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/SavedPathsPage.jsx) | UI | component | Displays and manages a user's saved immigration paths | Medium |
| [src/components/PrivacyPage.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/PrivacyPage.jsx) | UI | component | UI for managing privacy settings and reading policies | Low |
| [src/components/PassagrMarks.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/PassagrMarks.jsx) | UI | component | UI component for map markers or specific visual marks | Low |
| [src/components/GhostTextLayer.tsx](file:///Users/sarahsahl/Desktop/passagr/src/components/GhostTextLayer.tsx) | UI | component | Text overlay or loading skeleton component | Low |
| [ui/editor/ReviewPanel.tsx](file:///Users/sarahsahl/Desktop/passagr/ui/editor/ReviewPanel.tsx) | UI | component | Administrative UI panel used for editorial review of staged changes | Medium |
| [src/lib/api.js](file:///Users/sarahsahl/Desktop/passagr/src/lib/api.js), [src/lib/supabase.js](file:///Users/sarahsahl/Desktop/passagr/src/lib/supabase.js) | UI | util | Frontend utilities for handling API and database interactions | Low |
| [src/lib/formatters.js](file:///Users/sarahsahl/Desktop/passagr/src/lib/formatters.js) | UI | util | Formatting functions applied to frontend data presentation | Low |
| [src/index.css](file:///Users/sarahsahl/Desktop/passagr/src/index.css), [src/styles/assets.css](file:///Users/sarahsahl/Desktop/passagr/src/styles/assets.css) | UI | config | Stylesheets establishing the design system and layouts | Low |
| `supabase/migrations/*` | Database | migration | Supabase migrations including core schema, RLS, and staging tables | High |
| `migrations/archive/*` | Database | migration | Legacy initialized data and schema migrations | Low |
| [supabase/seed/seed_matching_destinations.ts](file:///Users/sarahsahl/Desktop/passagr/supabase/seed/seed_matching_destinations.ts) | Database | script | Seeds database with destination data for testing matching algorithms | Low |
| [seed_api.js](file:///Users/sarahsahl/Desktop/passagr/seed_api.js), [seed_data.js](file:///Users/sarahsahl/Desktop/passagr/seed_data.js), [seed_data.ts](file:///Users/sarahsahl/Desktop/passagr/seed_data.ts) | Database | script | Root level scripts to seed the database with initial/dummy data | Low |
| `scripts/sync_*_from_countries.*` | Scripts | script | Automation to sync and backfill metadata from country JSON definitions | Medium |
| `scripts/backfill_*.cjs`, `scripts/backfill_*.sql` | Scripts | script | Scripts handling one-off data backfills and state updates | Medium |
| [scripts/generate-country-geojson.ts](file:///Users/sarahsahl/Desktop/passagr/scripts/generate-country-geojson.ts) | Scripts | script | Transforms raw shapefiles into optimized GeoJSON for the frontend | Medium |
| [scripts/data_integrity_audit.sql](file:///Users/sarahsahl/Desktop/passagr/scripts/data_integrity_audit.sql) | Scripts | script | SQL script validating referential integrity and data constraints | Medium |
| [scripts/rls_public_read_tests.ts](file:///Users/sarahsahl/Desktop/passagr/scripts/rls_public_read_tests.ts), `verify_*.ts` | Scripts | script | Scripts running explicit assertions on Data Security and RLS | Medium |
| `test_*.cjs`, `test_*.ts` | Scripts | script | Ad-hoc or manual test utilities executed against external environments | Low |
| `tests/*` | Tests | script | Automated E2E, unit, and integration tests | Low |
| [package.json](file:///Users/sarahsahl/Desktop/passagr/package.json), `*config.*`, `.env.*`, [netlify.toml](file:///Users/sarahsahl/Desktop/passagr/netlify.toml) | Config | config | Various project configurations, dependencies, environmental variables | Low |
| `data/*`, [countries.json](file:///Users/sarahsahl/Desktop/passagr/countries.json), etc. | Data | data | Raw datasets, spatial data, and offline JSON stores | Low |
| `docs/*`, [architecture.html](file:///Users/sarahsahl/Desktop/passagr/architecture.html), [agents.md](file:///Users/sarahsahl/Desktop/passagr/agents.md), `*.md` | Docs | docs | General system and architecture documentation | Low |

---

## 2. Domain Map

Below is a clustered view denoting which files belong to which top-level domains across the repository.

*   **API**: `api/*`, [netlify/functions/public-countries.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/public-countries.ts), `netlify/functions/_shared/*`
*   **Privacy & Compliance**: `netlify/functions/v1-privacy-*`, [src/server/crypto/envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts), [netlify/functions/PRIVACY_API.md](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/PRIVACY_API.md)
*   **Data Ingestion & Processing**: `workers/*`
*   **Search**: `search/*`
*   **UI (Frontend)**: `src/components/*`, `src/App.*`, `ui/*`, `src/lib/*`, CSS files
*   **Database**: `supabase/migrations/*`, `migrations/*`, `supabase/seed/*`, Root `seed_*.js`/[.ts](file:///Users/sarahsahl/Desktop/passagr/seed_data.ts)
*   **Scripts & Tools**: `scripts/*`, [verify_safety_columns.ts](file:///Users/sarahsahl/Desktop/passagr/verify_safety_columns.ts), [test_db.cjs](file:///Users/sarahsahl/Desktop/passagr/test_db.cjs), [test_editorial.ts](file:///Users/sarahsahl/Desktop/passagr/test_editorial.ts)
*   **Tests**: `tests/*`
*   **Configuration**: [package.json](file:///Users/sarahsahl/Desktop/passagr/package.json), [vite.config.ts](file:///Users/sarahsahl/Desktop/passagr/vite.config.ts), [netlify.toml](file:///Users/sarahsahl/Desktop/passagr/netlify.toml), [jest.config.js](file:///Users/sarahsahl/Desktop/passagr/jest.config.js), [tsconfig.json](file:///Users/sarahsahl/Desktop/passagr/tsconfig.json), [babel.config.cjs](file:///Users/sarahsahl/Desktop/passagr/babel.config.cjs), [postcss.config.js](file:///Users/sarahsahl/Desktop/passagr/postcss.config.js), `.env.*`
*   **Documentation & Data**: `docs/*`, `data/*`, [countries.json](file:///Users/sarahsahl/Desktop/passagr/countries.json), HTML files, Markdown files.

---

## 3. Recommended Audit Order

For a deep systematic audit of the repository, focus first on the central hubs possessing the highest complexity, where architectural logic merges or user security is tightly controlled. 

1.  **Privacy & Compliance (`netlify/functions/v1-privacy-*`, [src/server/crypto/envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts))**
    *   **Reasoning**: Deletion requests, data extraction jobs, and envelope encryption are inherently critical. Flaws here yield major security gaps and regulatory violations. This should be audited strictly for robust idempotency, state isolation, and cryptographic safety.
    
2.  **Database Security & Migrations (`supabase/migrations/*`, [scripts/data_integrity_audit.sql](file:///Users/sarahsahl/Desktop/passagr/scripts/data_integrity_audit.sql))**
    *   **Reasoning**: The Row Level Security (RLS) policies defined in these migrations act as the ultimate backstop. An exhaustive audit is required to ensure policies properly gate data, especially relating to privacy elements, drafts/staging tables (evident from the `publish_*` and `staging-table` migrations).

3.  **Data Ingestion Pipeline ([workers/differ.ts](file:///Users/sarahsahl/Desktop/passagr/workers/differ.ts), [workers/editorial_router.ts](file:///Users/sarahsahl/Desktop/passagr/workers/editorial_router.ts), [workers/publisher.ts](file:///Users/sarahsahl/Desktop/passagr/workers/publisher.ts))**
    *   **Reasoning**: This core loop governs how truth is ingested, diffed, staged for review, and ultimately published. Since this system modifies production knowledge, it demands close scrutiny regarding atomicity, how edge cases are routed, and how the state machine transitions.

4.  **Core UI Logic & Features ([src/components/PathChecklistExperience.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/PathChecklistExperience.jsx), [src/components/ImmigrationMap.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/ImmigrationMap.jsx), [src/components/VisaPathChecklist.jsx](file:///Users/sarahsahl/Desktop/passagr/src/components/VisaPathChecklist.jsx))**
    *   **Reasoning**: These are the primary value-delivery mechanisms for users. Audit for proper state management, react hooks correctness, client-side data exposure, and general handling of asynchronous operations.

5.  **Main API Capabilities ([api/server.ts](file:///Users/sarahsahl/Desktop/passagr/api/server.ts), [api/jobs.ts](file:///Users/sarahsahl/Desktop/passagr/api/jobs.ts), `netlify/functions/_shared/*`)**
    *   **Reasoning**: General purpose endpoints and background job triggers. Validate idempotency headers, payload sanitization, and correct authorization handling.

6.  **Search Synchronization ([search/sync_worker.ts](file:///Users/sarahsahl/Desktop/passagr/search/sync_worker.ts))**
    *   **Reasoning**: While not a strict security issue, failure loops or mapping issues here cause significant UI consistency issues downstream. Check for race conditions and payload structures.

7.  **Maintenance Scripts & Tests (`scripts/*`, `tests/*`, etc.)**
    *   **Reasoning**: Asses last to ensure test coverage appropriately tests the above constraints and to determine if utility scripts violate standard ORM/DB patterns.
