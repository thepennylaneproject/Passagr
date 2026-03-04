# Security Audit — API Layer

**Date:** 2026-02-27  
**Scope:** `api/server.ts`, `api/admin.ts`, `api/jobs.ts`, `api/public.ts`, `api/db.ts`, `netlify.toml`, `netlify/functions/_shared/*`, `netlify/functions/public-countries.ts`, `netlify/functions/v1-privacy-*.ts`

---

## Summary Table

| #    | File(s)                                                                                  | Finding                                                                                                                                                      | Severity   | OWASP Category                       |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------ |
| A-1  | `admin.ts:8`                                                                             | Fallback `dev-admin-key` hardcoded as default                                                                                                                | **HIGH**   | A07 – Identification & Auth Failures |
| A-2  | `jobs.ts:10`                                                                             | Fallback `dev-secret` hardcoded as default for cron auth                                                                                                     | **HIGH**   | A07 – Identification & Auth Failures |
| A-3  | `admin.ts:113–144`                                                                       | `reviewer_uid` accepted from request body — caller self-designates identity                                                                                  | **HIGH**   | A01 – Broken Access Control          |
| A-4  | `public.ts:262–279`                                                                      | `getChangelog` accepts `entity_type` from query string with no allowlist — written directly to parameterized query but no type-gating                        | **MEDIUM** | A03 – Injection                      |
| A-5  | `public.ts` (all handlers)                                                               | No rate limiting on any public endpoint                                                                                                                      | **MEDIUM** | A05 – Security Misconfiguration      |
| A-6  | `jobs.ts:41–48, 78–86, 129–136`                                                          | `error.message` from internal exceptions returned in 500 responses to job callers                                                                            | **MEDIUM** | A05 – Security Misconfiguration      |
| A-7  | `v1-privacy-exports-create.ts:116–119`, `v1-privacy-deletion-requests-create.ts:103–106` | `error.message` from internal exceptions returned in 500 responses                                                                                           | **MEDIUM** | A05 – Security Misconfiguration      |
| A-8  | `_shared/supabase.ts:7,14–36`                                                            | `serviceClient` is a module-level singleton — shared across all serverless invocations on warm containers                                                    | **MEDIUM** | A01 – Broken Access Control          |
| A-9  | `netlify.toml`                                                                           | No `[[headers]]` block — no CSP, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` headers set                                               | **MEDIUM** | A05 – Security Misconfiguration      |
| A-10 | `public-countries.ts`                                                                    | No security headers returned with GeoJSON response                                                                                                           | **LOW**    | A05 – Security Misconfiguration      |
| A-11 | `server.ts:49–55`                                                                        | CORS `methods` list includes `HEAD` but is otherwise correct; `credentials: true` combined with an env-var origin is acceptable                              | **INFO**   | —                                    |
| A-12 | `admin.ts:79–88`                                                                         | Dynamic `SELECT * FROM ${tableName}` with allowlisted table name — safe, but returns entire row including any future sensitive columns added to those tables | **LOW**    | A01 – Broken Access Control          |
| A-13 | `netlify.toml:12`                                                                        | `SECRETS_SCAN_ENABLED = "false"` disables Netlify's built-in secret scanning                                                                                 | **LOW**    | A05 – Security Misconfiguration      |

---

## Detailed Findings

---

### A-1 · Hardcoded Fallback Admin Key — HIGH

**File:** `api/admin.ts`, line 8  
**OWASP:** A07 – Identification & Authentication Failures

```typescript
const expectedKey = process.env.ADMIN_API_KEY || "dev-admin-key";
```

If `ADMIN_API_KEY` is missing or empty in the runtime environment, all admin endpoints fall back to accepting the string `dev-admin-key`. Any attacker who reads this source file (open-source repo, leaked commit, or any deploy that forgot the env var) can immediately access every admin review endpoint.

**The env-var crash guard in `server.ts` (line 30–33) only fires at startup** — it does not protect against the env var being blank or stripped at load time after startup or in edge cases where the key is set to an empty string.

**Recommended Fix:**

```typescript
const expectedKey = process.env.ADMIN_API_KEY;
if (!expectedKey) {
  res.status(503).json({ error: 'Service unavailable' });
  return;
}
if (adminKey !== expectedKey) { ... }
```

Remove the fallback entirely. Rely on the startup guard, but also remove the `||` fallback so a blank env var doesn't create a bypass.

---

### A-2 · Hardcoded Fallback Cron Secret — HIGH

**File:** `api/jobs.ts`, line 10  
**OWASP:** A07 – Identification & Authentication Failures

```typescript
const expectedSecret = process.env.CRON_SECRET || "dev-secret";
```

Identical pattern to A-1. Any authenticated caller who knows or guesses `dev-secret` can trigger expensive background jobs (freshness scan, full link-check over all URLs, index refresh) on demand. These jobs perform outbound network requests and heavy DB queries, creating a **resource exhaustion / SSRF amplification risk** in addition to the auth bypass.

**Recommended Fix:** Same as A-1 — remove the fallback, throw a hard 503 if the env var is absent inside the middleware.

---

### A-3 · `reviewer_uid` Accepted from Request Body — HIGH

**File:** `api/admin.ts`, lines 115, 150  
**OWASP:** A01 – Broken Access Control

```typescript
const { reviewer_uid, notes } = req.body;
// ...
[reviewer_uid || "admin", notes || "Approved", id];
```

The admin key authenticates that the caller _is_ an admin, but it does not identify _which_ admin. The `reviewer_uid` written to the audit trail is whatever the caller sends in the request body. A caller can impersonate any other reviewer by passing an arbitrary `reviewer_uid`.

For audit trail integrity (and future multi-admin accountability), the reviewer identity must be derived server-side — either from the calling credential or from the API key itself (e.g., a per-reviewer API key mapped in configuration), not accepted from the client.

**Recommended Fix:** Map the `ADMIN_API_KEY` (or a per-reviewer key) to a fixed identity stored server-side, and set `reviewer_uid` from that mapping rather than from `req.body`.

---

### A-4 · `entity_type` Query Param Written to DB Without Type Allowlist — MEDIUM

**File:** `api/public.ts`, lines 263–278  
**OWASP:** A03 – Injection (parameterization is present, but semantic validation is not)

```typescript
const { entity_type, entity_id } = req.query;
// ...
const result = await pool.query(
  `SELECT * FROM changelogs WHERE entity_type = $1 AND entity_id = $2 ...`,
  [entity_type, entity_id],
);
```

SQL injection is not possible here (parameters are bound). However, `entity_type` is stored verbatim from user input with no enum validation. This means:

- Garbage/unexpected values are silently stored/compared against the DB column.
- If the changelog table has an index on `entity_type`, large numbers of unique values from clients can pollute it (index bloat via value stuffing).
- It is inconsistent with the admin layer which explicitly allowlists entity types.

**Recommended Fix:**

```typescript
const VALID_ENTITY_TYPES = new Set([
  "country",
  "visa_path",
  "requirement",
  "step",
]);
if (!VALID_ENTITY_TYPES.has(entity_type as string)) {
  return res.status(400).json({ error: "Invalid entity_type" });
}
```

---

### A-5 · No Rate Limiting on Public Endpoints — MEDIUM

**File:** `api/public.ts`, `api/server.ts`  
**OWASP:** A05 – Security Misconfiguration

The server applies an in-memory rate limiter only to `/admin/*` routes (lines 83–101 in `server.ts`). There is **no rate limiter on any `/public/*` endpoint**.

`GET /public/countries` is particularly expensive — it runs a multi-table join across `country_profile_compact`, `country_pathway_summary`, `country_healthcare_metrics`, and `country_quality_of_life`, then merges the result set with the full GeoJSON base map (which can be hundreds of KB). While caching helps (30-second TTL), a burst of cold-cache requests before the TTL resets can cause significant DB load.

`GET /public/visa-paths/:id` and `GET /public/changelog` have no caching at all.

**Recommended Fix:** Apply the same rate-limiter pattern from `/admin` to `/public`, or use a reverse-proxy-level rate limit (Netlify rate limiting rules, Cloudflare, etc.). Add response caching to `getVisaPathById` and `getChangelog`.

---

### A-6 · Internal Error Messages Leaked in Job Responses — MEDIUM

**File:** `api/jobs.ts`, lines 41–48, 78–86, 129–136  
**OWASP:** A05 – Security Misconfiguration

```typescript
} catch (error: any) {
    res.status(500).json({
        success: false,
        job: 'freshness-scan',
        error: error.message,   // ← raw internal message
        ...
    });
}
```

All three job handlers return `error.message` directly in the 500 response. While job endpoints are protected by cron auth, it is still poor hygiene — internal DB error messages, query text fragments, file paths, or connection strings can appear in responses if the underlying error comes from `pg` or Node internals.

**Recommended Fix:** Return a generic `"Internal job error"` message in the response body; log `error` (full stack) only to the server console.

---

### A-7 · Internal Error Messages Leaked in Netlify Function 500 Responses — MEDIUM

**File:** `netlify/functions/v1-privacy-exports-create.ts` (lines 116–119), `v1-privacy-deletion-requests-create.ts` (lines 103–106)  
**OWASP:** A05 – Security Misconfiguration

```typescript
return {
  statusCode: 500,
  body: JSON.stringify({
    error: "Internal server error",
    details: error.message, // ← leaks Supabase/internal error text
  }),
};
```

The `details` field is returned in the response body to any authenticated (or unauthenticated, if auth fails before this point) caller. Supabase error messages can include table names, column names, constraint names, and policy names.

Note also that the 500 path at line 116–119 of `v1-privacy-exports-create.ts` is reachable _without_ authentication — if, for example, `verifySupabaseUser` itself throws an error that does not include `"Authorization"` or `"token"` in its message (e.g., network timeout reaching the Supabase auth endpoint), execution falls through to the generic 500 handler and `error.message` is returned to an unauthenticated caller.

**Recommended Fix:** Remove the `details` field from all 500 responses returned to clients. Log `error.message` + full stack to the console only.

---

### A-8 · Service Client Singleton Shared Across Serverless Invocations — MEDIUM

**File:** `netlify/functions/_shared/supabase.ts`, lines 7, 14–36  
**OWASP:** A01 – Broken Access Control

```typescript
let serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;    // ← reused across invocations
  }
  // ...
  serviceClient = createClient(...);
  return serviceClient;
}
```

The module-level `serviceClient` singleton is initialized once and reused across all requests that share the same warm Lambda/V8 container. For the **service role client** (which bypasses RLS), this is a common Serverless pattern and is safe because the service role key doesn't carry per-user state.

However, **`checkIdempotencyKey` and `storeIdempotencyKey` both call `getServiceClient()`** — the service role client — to access the `idempotency_keys` table. All idempotency reads and writes go through the superuser client rather than a user-scoped client. If RLS is not enforced on `idempotency_keys`, any function that can call these utilities could read or overwrite another user's idempotency keys by knowing the key value. The user_id is used as a filter in the query, but the DB-level protection depends entirely on application-layer correctness with no RLS backstop.

**Recommended Fix:** Verify that the `idempotency_keys` table has RLS enabled with a policy of `auth.uid() = user_id`. Alternatively, perform idempotency DB operations using `getUserClient(jwt)` so RLS enforces the scope.

---

### A-9 · No Security Response Headers on Netlify-Served Routes — MEDIUM

**File:** `netlify.toml`  
**OWASP:** A05 – Security Misconfiguration

The `netlify.toml` contains no `[[headers]]` blocks. This means responses served through Netlify (the SPA, Netlify functions, and function redirects) do not set:

| Header                            | Risk Without It                                                              |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `Content-Security-Policy`         | XSS attacks can execute arbitrary scripts                                    |
| `X-Frame-Options`                 | Clickjacking via iframe embedding                                            |
| `X-Content-Type-Options: nosniff` | MIME-type sniffing attacks                                                   |
| `Referrer-Policy`                 | Sensitive URL fragments/params leak in Referer header to third-party domains |
| `Permissions-Policy`              | Browser feature access unrestricted                                          |

The Express server does use `helmet()` (which sets these headers for the Node API server), but that server is separate from Netlify's edge layer. All Netlify function responses and the SPA itself are served without these protections.

**Recommended Fix:** Add a `[[headers]]` block to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), camera=(), microphone=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; ..."
```

CSP policy values will depend on which CDNs/fonts/APIs the frontend loads from.

---

### A-10 · `public-countries` Netlify Function Has No Security Headers — LOW

**File:** `netlify/functions/public-countries.ts`  
**OWASP:** A05 – Security Misconfiguration

The function returns the GeoJSON response with only `Content-Type` set. Because the catch-all `[[headers]]` fix (A-9) won't apply to function response bodies, function handlers must set their own headers explicitly.

**Recommended Fix:** Add to the return object:

```typescript
headers: {
    'Content-Type': 'application/geo+json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
}
```

---

### A-11 · CORS Configuration — INFO

**File:** `api/server.ts`, lines 49–55

```typescript
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN, // ✅ Specific domain, not '*'
  methods: ["GET", "HEAD", "POST"],
  credentials: true,
  optionsSuccessStatus: 204,
};
```

CORS is correctly scoped to a specific origin from env. `HEAD` is low-risk but arguably unnecessary for this API — consider removing if not explicitly needed. `credentials: true` is correct since the frontend likely sends auth cookies or the `Authorization` header. No issue raised, noting for completeness.

---

### A-12 · `SELECT *` on Dynamic Table in Admin Details — LOW

**File:** `api/admin.ts`, lines 80–87

```typescript
const entityResult = await pool.query(
  `SELECT * FROM ${tableName} WHERE id = $1`,
  [review.entity_id],
);
```

The table name comes from a strict allowlist (`getTableName`), so SQL injection is not possible. However, `SELECT *` means any future column added to `countries`, `visa_paths`, `requirements`, or `steps` — including potentially sensitive internal columns (e.g., internal cost scores, soft-deleted data flags, hidden fields) — will be returned to the admin UI and visible in responses. This is a data minimization concern under GDPR Article 5(1)(c).

**Recommended Fix:** Enumerate explicit column lists rather than `SELECT *`, or implement a column exclusion list that filters out internal/sensitive fields from the entity result.

---

### A-13 · Netlify Secret Scanning Disabled — LOW

**File:** `netlify.toml`, line 12

```toml
[build.environment]
  SECRETS_SCAN_ENABLED = "false"
```

Netlify's built-in secret scanning is disabled. This means API keys, service role keys, or database URLs accidentally committed to the codebase or build artifacts will not be automatically detected and flagged during deployments.

**Recommended Fix:** Enable secret scanning (`SECRETS_SCAN_ENABLED = "true"`) and resolve whatever was triggering it. If there are legitimate secrets in the build environment that cannot be moved, scope the exclusion to specific variables rather than disabling scanning entirely.

---

## Area-by-Area Assessment

### Authentication & Authorization

| Endpoint Group                       | Auth Enforced | Auth Mechanism         |   Admin-Role Check    | Notes                                          |
| ------------------------------------ | :-----------: | ---------------------- | :-------------------: | ---------------------------------------------- |
| `GET /public/*`                      |    ❌ None    | Public                 |          N/A          | Intentionally public                           |
| `GET/POST /admin/*`                  |      ✅       | `x-admin-key` header   | ✅ (same key = admin) | **Fallback `dev-admin-key` is critical (A-1)** |
| `POST /jobs/*`                       |      ✅       | `x-cron-secret` header |          N/A          | **Fallback `dev-secret` is critical (A-2)**    |
| `POST /v1/privacy/exports`           |      ✅       | Supabase JWT           |   User-scoped only    | Correct                                        |
| `POST /v1/privacy/deletion-requests` |      ✅       | Supabase JWT           |   User-scoped only    | Correct                                        |
| `GET /public/countries` (Netlify fn) |    ❌ None    | Public                 |          N/A          | Intentionally public                           |

All non-public endpoints enforce authentication. There is no admin role concept beyond the shared API key — meaning there is no per-admin identity, no admin privilege levels, and no audit trail of which admin performed which action (A-3).

### Input Validation & Sanitization

All SQL queries use parameterized queries (`$1`, `$2` etc.) — no raw SQL concatenation from user input is present. However:

- `getChangelog` accepts `entity_type` without an enum check (A-4).
- `approveReview`/`rejectReview` accept `reviewer_uid` from the request body (A-3).
- No schema validation library (Zod, Joi, etc.) is used — validation is ad-hoc per-handler.

### Job Trigger Security

Job endpoints (`/jobs/*`) are protected by a single shared `CRON_SECRET`. Any caller with this secret can trigger any of the three jobs. There is no per-job authorization or rate constraint on individual job endpoints. Given these are intended for cron-only invocation, the single secret is an acceptable pattern **if** the fallback issue (A-2) is resolved.

### Rate Limiting

- `/admin/*`: In-memory rate limiter applied (60 req/min default, configurable). The implementation is functional but **not replicated-safe** — it resets on server restart and does not work behind multiple server instances.
- `/public/*`: **No rate limiting** (A-5).
- `/jobs/*`: No rate limiting (acceptable if only called by cron at known intervals).
- Netlify functions: No rate limiting at the function layer. Netlify's platform-level rate limiting may apply depending on the plan.

### Error Response Hygiene

- Public endpoints (`/public/*`): ✅ Generic messages only (`'Failed to fetch countries'` etc.).
- Admin endpoints: ✅ Generic messages only.
- Job endpoints: ❌ `error.message` returned (A-6).
- Netlify privacy functions: ❌ `error.message` returned in `details` field (A-7).

### Shared Utility Security (`_shared/*`)

- `auth.ts` (`verifySupabaseUser`): ✅ Correctly verifies JWT via Supabase's `auth.getUser()`. Does not accept unverified claims.
- `auth.ts` (`extractToken`): ✅ Only extracts the token string; verification responsibility is on the caller. All callers in the codebase that need a verified user call `verifySupabaseUser` first.
- `supabase.ts` (`getServiceClient`): ⚠️ Singleton pattern — safe for the service role client itself, but idempotency table access should be RLS-gated (A-8).
- `supabase.ts` (`getUserClient`): ✅ Creates a new per-request client scoped to the user JWT. `persistSession: false` and `autoRefreshToken: false` are correctly set, preventing session state from persisting across invocations.
- `idempotency.ts`: ✅ Correct user_id scoping in queries. Risk is at the DB layer (A-8).
- `constants.ts`: ✅ No sensitive data.

### CORS & Headers

- Express API (`api/server.ts`): ✅ `helmet()` sets standard security headers. CORS is scoped to `CORS_ORIGIN` env var.
- Netlify functions: ❌ No `[[headers]]` block in `netlify.toml` (A-9). No headers set in `public-countries.ts` response (A-10).

---

## Prioritized Remediation Order

| Priority | Finding                                                          | Effort  |
| -------- | ---------------------------------------------------------------- | ------- |
| 🔴 P0    | A-1: Remove `dev-admin-key` fallback                             | 5 min   |
| 🔴 P0    | A-2: Remove `dev-secret` fallback                                | 5 min   |
| 🔴 P0    | A-3: Remove `reviewer_uid` from request body; derive server-side | Medium  |
| 🟠 P1    | A-5: Add rate limiting to public endpoints                       | Small   |
| 🟠 P1    | A-6, A-7: Scrub `error.message` from all 500 responses           | Small   |
| 🟠 P1    | A-9: Add `[[headers]]` block to `netlify.toml`                   | Small   |
| 🟡 P2    | A-4: Add `entity_type` enum validation to `getChangelog`         | Trivial |
| 🟡 P2    | A-8: Confirm RLS on `idempotency_keys` table                     | Small   |
| 🟡 P2    | A-10: Add security headers to `public-countries.ts`              | Trivial |
| 🟢 P3    | A-12: Replace `SELECT *` with explicit column list in admin      | Small   |
| 🟢 P3    | A-13: Re-enable `SECRETS_SCAN_ENABLED`                           | Trivial |
