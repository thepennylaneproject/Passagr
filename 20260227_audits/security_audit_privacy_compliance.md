# Passagr Privacy & Compliance — Security Audit

**Scope**: `netlify/functions/v1-privacy-deletion-requests-*`, [v1-privacy-deletion-worker.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts), `v1-privacy-exports-*`, [src/server/crypto/envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts)  
**Date**: 2026-02-27

---

## Summary Table

| # | Finding | Severity | Area |
|---|---------|----------|------|
| F-01 | KMS adapter loaded via `import()` from an env-controlled path — arbitrary code execution risk | **Critical** | Cryptography |
| F-02 | Singleton `serviceClient` shared across requests — stale/poisoned client bleeds between invocations | **High** | State Isolation |
| F-03 | Singleton `serviceClient` in [envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts) duplicates the one in [_shared/supabase.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/_shared/supabase.ts) | **High** | State Isolation |
| F-04 | `kmsAdapterPromise` singleton persists across warm invocations — not reset on env change | **High** | State Isolation |
| F-05 | [unwrapDek](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#262-295) passes unvalidated foreign `alg` field into `createDecipheriv` | **High** | Cryptography |
| F-06 | TOCTOU race in deletion cancel: read ownership → check status → update is non-atomic | **High** | Cancellation Integrity |
| F-07 | Export artifact path is user-controllable via `job.artifact_path` DB column | **High** | Export Scope |
| F-08 | Error detail leak: raw DB/network errors surfaced in 500 bodies to callers | **Medium** | Information Disclosure |
| F-09 | Idempotency key is not scoped to request payload — replay across different resources | **Medium** | Idempotency |
| F-10 | Idempotency store failure is silently swallowed — silent non-idempotency | **Medium** | Idempotency |
| F-11 | DEK zeroing inside [rotateUserDek](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#98-148) happens in `finally` before the insert succeeds | **Medium** | Cryptography |
| F-12 | [getMasterKek](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#318-335) derives key with SHA-256 of the raw env var — no KDF, low-entropy passphrases accepted | **Medium** | Cryptography |
| F-13 | `select('*')` in GET endpoints exposes all DB columns to the API response | **Medium** | Data Exposure |
| F-14 | Export worker uses `upsert: true` — pre-existing artifact silently overwritten | **Medium** | Export Integrity |
| F-15 | Cancellation of `in_progress` requests is accepted but worker may already be past the check | **Medium** | Cancellation Integrity |
| F-16 | No rate-limiting on deletion / export create endpoints | **Medium** | Abuse / GDPR |
| F-17 | Export download URL/path is stored plaintext in DB and returned to workers without expiry enforcement | **Medium** | Export Scope |
| F-18 | Soft-delete path leaves auth identity + email address live — GDPR erasure incomplete | **High** | Regulatory |
| F-19 | No `deletion_events` audit trail for export workers (only deletion worker has events) | **Low** | Regulatory |
| F-20 | [isAuthUserNotFound](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#478-482) uses loose substring match — "not found" in an unrelated error hides failures | **Low** | Deletion Reliability |
| F-21 | ZIP is created without encryption; export artifacts stored in Storage without per-file access policy | **Low** | Export Scope |
| F-22 | GDPR data portability: profile/account, auth.users fields not included in export | **Medium** | Regulatory |

---

## Detailed Findings

### F-01 · `ENVELOPE_KMS_ADAPTER` — Arbitrary Code Execution via Dynamic Import · **Critical**

**File**: [envelope.ts:309](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#L303-L316)

```typescript
const imported = await import(adapterPath); // adapterPath = process.env.ENVELOPE_KMS_ADAPTER
```

`adapterPath` is taken verbatim from an environment variable and passed to `import()`. If that variable is compromised (e.g., via Netlify env injection, a secrets-management breach, or a supply-chain attack), an attacker can load arbitrary code with full server-side privileges.

**Remediation**: Allowlist valid adapter module names or restrict to resolved paths within the project. Never pass environment data directly to `import()`.

---

### F-02 · Shared Mutable `serviceClient` Singleton in [_shared/supabase.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/_shared/supabase.ts) · **High**

**File**: [_shared/supabase.ts:7](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/_shared/supabase.ts#L7)

```typescript
let serviceClient: SupabaseClient | null = null;
```

This module-level mutable singleton persists across warm Lambda/Netlify invocations. Netlify Functions reuse the same process for multiple requests, so if one invocation corrupts the client (e.g., a partially-consumed response stream that times out), subsequent invocations inherit the poisoned state. Additionally, if credentials rotate and the function is not cold-started, the stale client with old credentials remains.

**Remediation**: Either (a) never reuse clients across request handlers and create fresh per-invocation, or (b) implement proper health-check reset logic before reuse.

---

### F-03 · Duplicate `serviceClient` Singleton in [envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts) · **High**

**File**: [envelope.ts:36](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#L36)

```typescript
let serviceClient: SupabaseClient | null = null; // different module singleton
```

[envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts) defines its own `serviceClient` singleton independently of `_shared/supabase.ts::getServiceClient`. Two distinct singletons with different lifecycle management create unpredictable behavior, especially during rotation. They are not synchronized and cannot be reset together.

**Remediation**: Consolidate to the single `_shared/supabase.ts::getServiceClient` factory.

---

### F-04 · `kmsAdapterPromise` Singleton Never Resets · **High**

**File**: [envelope.ts:37](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#L37)

```typescript
let kmsAdapterPromise: Promise<KmsAdapter | null> | null = null;
```

The KMS adapter is loaded once per process lifetime and cached permanently. If `ENVELOPE_KMS_ADAPTER` changes (e.g., rolled to a new version), warm functions continue using the old adapter. There is also no error recovery — if the first load fails with a rejected promise and the module is reused, subsequent calls chain onto the failed promise.

**Remediation**: Cache a resolved adapter, not a promise. Add error recovery so a failed load retries on next call.

---

### F-05 · [unwrapDek](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#262-295) Passes Unvalidated `alg` Field to `createDecipheriv` · **High**

**File**: [envelope.ts:273-292](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#L268-L294)

```typescript
const decoded = JSON.parse(fromBase64(encoded).toString('utf8')) as { alg: CipherGCMTypes; ... };

if (decoded.alg !== WRAP_ALGORITHM) {
  throw new Error('unsupported_wrapped_dek_algorithm');
}
// ✓ algorithm is checked

const decipher = createDecipheriv(WRAP_ALGORITHM, kek, nonce); // uses constant, OK
```

The `alg` check correctly rejects mismatches. However, after parsing, `decoded.nonce`, `decoded.ciphertext`, and `decoded.tag` are used without any length or format validation before being passed to crypto primitives. A crafted `wrapped_dek` in the DB (possible if the DB is compromised or via an injection path not yet reviewed) could cause [fromBase64()](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#373-376) to return a zero-length buffer, leading to a decipher constructed with an invalid nonce.

**Remediation**: Validate `nonce.length === NONCE_BYTES`, `tag.length === GCM_TAG_BYTES`, and `ciphertext.length >= DEK_BYTES` before calling `createDecipheriv`.

---

### F-06 · TOCTOU Race in Deletion Cancel — Non-Atomic Ownership + Status Check · **High**

**File**: [v1-privacy-deletion-requests-cancel.ts:44-83](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-requests-cancel.ts#L44-L83)

```typescript
// Step 1: ownership + status check
const { data: existingRequest } = await supabase
  .from('deletion_requests').select('id, status, user_id')
  .eq('id', requestId).eq('user_id', userId).single();

if (!['pending', 'in_progress'].includes(existingRequest.status)) { ... }

// Step 2: write cancel (separate round-trip — race window here)
const { data } = await supabase
  .from('deletion_requests').update({ status: 'cancelled' })
  .eq('id', requestId).eq('user_id', userId)...
```

Between the read (step 1) and the write (step 2) the deletion worker can transition the request from `pending` → `running` → `completed`. The cancel endpoint would then mark a **completed** deletion as `cancelled`, corrupting the audit trail for a regulation-relevant operation.

**Remediation**: Combine into a single atomic `UPDATE ... WHERE status IN ('pending','in_progress') AND user_id = $userId RETURNING *`. If `rowCount === 0`, the state transitioned concurrently and the cancel should return 409 Conflict.

---

### F-07 · Export Artifact Path Is User-Controllable via DB Column · **High**

**File**: [v1-privacy-exports-worker.ts:299-308](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts#L299-L308)

```typescript
function resolveArtifactPath(job: ExportJobRecord): string {
  const providedPath = typeof job.artifact_path === 'string' && job.artifact_path.trim().length > 0
    ? job.artifact_path.trim()
    : null;
  if (providedPath) {
    return providedPath; // ← uses whatever is in the DB
  }
  return `exports/${job.user_id}/${job.id}-${timestamp}.zip`;
}
```

If an attacker can write to the `export_jobs.artifact_path` column (e.g., via a DB misconfiguration or bypassed RLS), they can redirect the artifact upload to any path in the Storage bucket, potentially overwriting another user's export artifact.

**Remediation**: Either ignore `job.artifact_path` entirely (always derive from `user_id`/`job_id`), or validate that the stored path strictly starts with `exports/${job.user_id}/`.

---

### F-08 · Error Detail Leak in 500 Responses · **Medium**

**Files**: All endpoint handlers, e.g. [v1-privacy-deletion-requests-create.ts:104-107](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-requests-create.ts#L101-L107)

```typescript
return {
  statusCode: 500,
  body: JSON.stringify({ error: 'Internal server error', details: error.message }),
};
```

Raw Node.js / Supabase error messages (including SQL fragments, table names, column names, and connection strings) are returned verbatim in `details`. This leaks schema information useful for further attacks.

**Remediation**: Return a generic message to callers and log the full error server-side only.

---

### F-09 · Idempotency Key Not Scoped to Request Payload · **Medium**

**File**: [_shared/idempotency.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/_shared/idempotency.ts)

The idempotency key is stored against [(key, user_id, endpoint)](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#551-558). It is not bound to a hash of the request body. A client that reuses the same idempotency key with a different request body (e.g., different metadata) will silently receive the cached response from the first request, making the second, different request a no-op with no error.

**Remediation**: Include a hash of the canonical request body in the idempotency key lookup, or reject requests where the body does not match the stored body for a given key (standard Stripe-style behaviour).

---

### F-10 · Idempotency Store Failure Silently Swallowed · **Medium**

**File**: [_shared/idempotency.ts:64-71](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/_shared/idempotency.ts#L64-L71)

```typescript
await supabase.from('idempotency_keys').insert({ ... }); // return value discarded
```

The insert result is not checked. If the write fails (transient DB error, unique constraint), the function returns success to the caller with no retry or error. Future calls with the same key fall through to create a second resource, defeating idempotency.

**Remediation**: Check and handle the insert error; at minimum log it, or surface it as a 503 so the client retries.

---

### F-11 · DEK Zeroing in [rotateUserDek](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#98-148) May Zero After Failed Insert · **Medium**

**File**: [envelope.ts:108-143](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#L105-L143)

```typescript
const dek = randomBytes(DEK_BYTES);
try {
  const wrappedDek = await wrapDek(userId, nextVersion, dek);
  // ... rotate old key ...
  const { error: insertError } = await supabase...insert({ wrapped_dek: wrappedDek, ... });
  if (!insertError) { return nextVersion; }
  // on conflict retry — dek is still live in memory
} finally {
  dek.fill(0); // ← zeroes at end of this attempt, before retry loop completes
}
```

On a conflict-driven retry, the loop generates a new `dek` per attempt, which is correctly zeroed per attempt via `finally`. However, the `wrappedDek` string (containing the KMS/AES-ciphertext of the DEK) persists in the closure across retries and is not explicitly cleared. This is a minor hygiene concern in the local-KMS path since the DEK is encrypted, but is worth documenting.

**Remediation**: Low priority given the wrapped form is non-sensitive, but consider overwriting the intermediate string with a dummy value after use.

---

### F-12 · Master KEK Derives Key with SHA-256 — No KDF · **Medium**

**File**: [envelope.ts:318-333](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts#L318-L334)

```typescript
return createHash('sha256').update(keyMaterial).digest();
```

A raw passphrase from the environment is stretch-hashed with a single SHA-256 pass. If the `ENVELOPE_MASTER_KEY` is a human-memorable string (rather than a 256-bit random hex), a single hash provides essentially no brute-force resistance.

**Remediation**: Use PBKDF2 or Argon2 with a fixed salt derived from a non-secret domain separator, or — better — require `ENVELOPE_MASTER_KEY` to be exactly 32 bytes of cryptographically random material and reject anything else.

---

### F-13 · `select('*')` Returns All DB Columns to API Response · **Medium**

**Files**: [v1-privacy-deletion-requests-get.ts:42](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-requests-get.ts#L40-L44), [v1-privacy-exports-get.ts:41](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-get.ts#L39-L44)

Both GET endpoints query with `select('*')` and then return a response object constructed from `data.id` and `data.status`. However, the full `data` row including any sensitive columns (e.g., `failure_reason`, `metadata`, internal timestamps, `artifact_path`) is held in memory and could be inadvertently included if response construction changes. More importantly, code review shows `export_jobs` response currently only sends `job_id` and `status`, but the raw query returns `file_url` and `artifact_path` which are pre-signed Storage paths — returning these accidentally would allow unauthenticated artifact download.

**Remediation**: Use an explicit column selection: `.select('id, status')` to limit what is fetched and minimize accidental exposure.

---

### F-14 · Export Worker Uses `upsert: true` — Arbitrary Overwrite · **Medium**

**File**: [v1-privacy-exports-worker.ts:83-87](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts#L79-L91)

```typescript
await supabase.storage.from(PRIVACY_EXPORT_ARTIFACTS_BUCKET)
  .upload(artifactPath, bundle, { upsert: true });
```

If (per F-07) an attacker controls `artifactPath`, `upsert: true` means they can silently overwrite an existing object with no conflict error. Even without F-07, upsert for a privacy export artifact is semantically incorrect — it should always be a new unique object.

**Remediation**: Use `upsert: false`. If the path already exists, generate a fresh unique path.

---

### F-15 · Cancellation of `in_progress` Requests Has No Worker-Side Check · **Medium**

**File**: [v1-privacy-deletion-worker.ts:60-113](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#L60-L113)

The deletion worker claims a request by transitioning `pending` → `running`. It does not re-check the status mid-flow (between steps). A user can successfully cancel an `in_progress` request via the cancel endpoint (F-06 aside), but the worker continues executing all remaining deletion steps unaware of the cancellation, then attempts to call [updateRequestStatus](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#454-472) with `expectedCurrentStatus = 'running'` and payload `status: 'completed'` — which will succeed because the cancel endpoint uses `status: 'cancelled'` without verifying the expected prior state either.

**Remediation**: The worker should re-check the request status before marking it complete (or after each step), and abort if it has been cancelled. The [updateRequestStatus](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#454-472) should assert the expected status to prevent overwriting a `cancelled` record.

---

### F-16 · No Rate-Limiting on Create Endpoints · **Medium**

**Files**: [v1-privacy-deletion-requests-create.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-requests-create.ts), [v1-privacy-exports-create.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-create.ts)

A user can submit unlimited deletion or export requests. For exports, each job triggers a full SELECT of all user-owned tables and a Storage upload. This is an easy denial-of-service vector (against the worker queue and Storage quota) and could also be used to flood the `deletion_requests` or `export_jobs` tables.

**Remediation**: Check for an existing `pending`/`in_progress` request before creating a new one, and return 429 if one already exists. Enforce per-user rate limits (e.g., max 1 export per 24h per GDPR norms).

---

### F-17 · Export Artifact URL Stored Plaintext; No Token-Based Expiry Enforced · **Medium**

**File**: [v1-privacy-exports-worker.ts:95-104](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts#L94-L104)

`artifact_path` and `file_url` are stored as plain Storage paths in `export_jobs`. The `expires_at` column is set to 24h, but there is no mechanism that actually invalidates the Storage object or revokes access after expiry. Anyone with the path (and bucket read access) can retrieve the file indefinitely.

**Remediation**: On access, generate a short-lived signed URL (Supabase `createSignedUrl`) rather than storing a permanent path. Remove the Storage object when `expires_at` passes (scheduled cleanup).

---

### F-18 · Soft-Delete Path Leaves PII in Auth Identity — GDPR Erasure Incomplete · **High**

**File**: [v1-privacy-deletion-worker.ts:435-451](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#L435-L451)

When `PRIVACY_DELETE_AUTH_USER !== 'true'` (the default), the worker performs a soft-delete: it updates `user_metadata` with `privacy_deleted: true` but leaves the `auth.users` row fully intact — including `email`, `phone`, `created_at`, `last_sign_in_at`, OAuth-linked `identities`, and any other PII stored by Supabase Auth. Under GDPR Article 17 (Right to Erasure), a data subject's request must result in deletion of personal data, not just flagging.

**Remediation**: For GDPR-covered users, hard delete the `auth.users` record (`PRIVACY_DELETE_AUTH_USER=true`). If the soft path is retained for business reasons, at minimum anonymize the email (e.g., replace with a non-reversible token) before marking `privacy_deleted`.

---

### F-19 · Export Worker Has No Audit Event Trail · **Low**

**File**: [v1-privacy-exports-worker.ts](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts)

The deletion worker records every step in `deletion_events` with `step_started:*` and `step_completed:*`. The export worker has no equivalent — only `console.log`/`console.error` calls. For GDPR compliance, you need an auditable record of when exports were generated and delivered.

**Remediation**: Add an `export_events` table (or reuse `deletion_events` with a discriminator) and log `export_started`, `export_completed`, `export_failed` events per job.

---

### F-20 · [isAuthUserNotFound](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#478-482) Uses Loose Substring Match · **Low**

**File**: [v1-privacy-deletion-worker.ts:478-481](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-deletion-worker.ts#L478-L481)

```typescript
return message.includes('user not found') || message.includes('not found');
```

The second clause `includes('not found')` will suppress any error message containing "not found" — including transient infrastructure errors (e.g., "DNS not found", "endpoint not found"). This could cause real errors to be swallowed and the deletion to silently proceed as `already_deleted`.

**Remediation**: Check the Supabase error code (`error.status === 404` or specific error code) rather than substring-matching the human-readable message.

---

### F-21 · Export ZIP Not Encrypted; Storage Bucket Policy Not Verified · **Low**

**File**: [v1-privacy-exports-worker.ts:205-237](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts#L205-L237)

The ZIP archive containing the user's personal data export is created with `deflateRaw` compression but no encryption. The artifact is then uploaded to a Supabase Storage bucket. If the bucket is mistakenly set to public, or if a signed-URL scope is too broad, any observer with the URL gets the full export unprotected.

**Remediation**: Confirm the bucket policy is private. Consider encrypting the ZIP payload with the user's DEK (from [envelope.ts](file:///Users/sarahsahl/Desktop/passagr/src/server/crypto/envelope.ts)) so only the user's key can decrypt it.

---

### F-22 · Export Scope Missing Auth Profile Fields — GDPR Portability Incomplete · **Medium**

**File**: [v1-privacy-exports-worker.ts:47-56](file:///Users/sarahsahl/Desktop/passagr/netlify/functions/v1-privacy-exports-worker.ts#L47-L56)

The export covers 8 application tables scoped to `user_id`. It does not include:
- `auth.users` profile (email, name, created_at, OAuth identities)
- `idempotency_keys` (included in deletion but not export)
- `deletion_requests` history itself
- Any data in `wrapped_encryption_keys` tables

Under GDPR Article 20 (Right to Data Portability), the export must include **all personal data provided by the data subject**, which includes their account profile.

**Remediation**: Add `auth.users` profile data via `supabase.auth.admin.getUserById(userId)` and include it in the export bundle. Include `idempotency_keys` and request history tables as well.

---

## Regulatory Assessment

### GDPR Compliance

| Requirement | Status |
|---|---|
| Right to Erasure (Art. 17) — app data | ✅ Covered (hard-deletes all user_* tables) |
| Right to Erasure (Art. 17) — auth identity | ⚠️ Incomplete by default (soft-delete leaves PII; F-18) |
| Right to Erasure (Art. 17) — backups | ❌ Not addressed (no mention of backup purge schedule) |
| Right to Portability (Art. 20) — app data | ✅ Partial (8 tables exported) |
| Right to Portability (Art. 20) — profile data | ❌ Missing (auth.users fields; F-22) |
| Audit trail for erasure requests | ✅ deletion_events table |
| Audit trail for export requests | ⚠️ Incomplete (only console logs; F-19) |
| Erasure completeness within 30 days | ✅ Scheduled worker runs every 5 min |
| Erasure of export artifacts | ✅ Covered by deletion worker step 2 |
| Rate limiting / abuse prevention | ❌ Missing (F-16) |

### CCPA Compliance

| Requirement | Status |
|---|---|
| Right to Delete — personal information | ⚠️ Same gaps as GDPR (F-18) |
| Right to Know / Data Portability | ⚠️ Same scope gap as GDPR (F-22) |
| Respond within 45 days | ✅ Worker runs every 5 min |
| Opt-out mechanics | ℹ️ Out of scope for this audit |

---

## Priority Remediation Order

1. **F-01** — Block arbitrary KMS adapter path injection (Critical)
2. **F-18** — Ensure auth identity erasure for GDPR users (High)
3. **F-06** — Make cancellation atomic at the DB level (High)
4. **F-07 + F-14** — Lock down artifact path resolution and remove upsert (High)
5. **F-05** — Validate unwrapped DEK field lengths before crypto use (High)
6. **F-02 + F-03 + F-04** — Consolidate and fix singleton lifecycle (High)
7. **F-08** — Strip error details from 500 responses (Medium)
8. **F-15** — Add worker-side cancellation awareness (Medium)
9. **F-09 + F-10** — Harden idempotency key scoping and error handling (Medium)
10. **F-22 + F-19** — Complete export scope and add audit trail (Medium / Regulatory)
