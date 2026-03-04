# Privacy API Endpoints

Backend endpoints for Passagr privacy compliance using Netlify Functions.

## Overview

This implementation provides data export and deletion request endpoints compliant with privacy regulations (GDPR, CCPA). All endpoints use Supabase for authentication and RLS for data isolation.

## Endpoints

### Export Jobs

#### Create Export Job

```
POST /.netlify/functions/v1-privacy-exports-create
```

**Headers:**

- `Authorization: Bearer <jwt_token>` (required)
- `Idempotency-Key: <unique_key>` (optional)

**Request Body:**

```json
{
  "export_format": "json", // optional: "json" or "csv", defaults to "json"
  "metadata": {} // optional: custom metadata
}
```

**Response (201):**

```json
{
  "job_id": "uuid",
  "status": "pending"
}
```

---

#### Get Export Job Status

```
GET /.netlify/functions/v1-privacy-exports-get/:job_id
```

**Headers:**

- `Authorization: Bearer <jwt_token>` (required)

**Response (200):**

```json
{
  "job_id": "uuid",
  "status": "pending | in_progress | completed | failed | cancelled",
  "export_format": "json",
  "file_url": "https://...", // when completed
  "file_size_bytes": 12345, // when completed
  "expires_at": "2024-01-01T00:00:00Z",
  "requested_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:00:00Z", // when completed
  "failed_at": "2024-01-01T00:00:00Z", // when failed
  "failure_reason": "...", // when failed
  "metadata": {}
}
```

---

### Deletion Requests

#### Create Deletion Request

```
POST /.netlify/functions/v1-privacy-deletion-requests-create
```

**Headers:**

- `Authorization: Bearer <jwt_token>` (required)
- `Idempotency-Key: <unique_key>` (optional)

**Request Body:**

```json
{
  "metadata": {} // optional: custom metadata
}
```

**Response (201):**

```json
{
  "request_id": "uuid",
  "status": "pending"
}
```

---

#### Get Deletion Request Status

```
GET /.netlify/functions/v1-privacy-deletion-requests-get/:id
```

**Headers:**

- `Authorization: Bearer <jwt_token>` (required)

**Response (200):**

```json
{
  "request_id": "uuid",
  "status": "pending | in_progress | completed | failed | cancelled",
  "requested_at": "2024-01-01T00:00:00Z",
  "started_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:00:00Z",
  "failed_at": "2024-01-01T00:00:00Z",
  "cancelled_at": "2024-01-01T00:00:00Z",
  "failure_reason": "...",
  "metadata": {}
}
```

---

#### Cancel Deletion Request

```
POST /.netlify/functions/v1-privacy-deletion-requests-cancel/:id
```

**Headers:**

- `Authorization: Bearer <jwt_token>` (required)

**Response (200):**

```json
{
  "request_id": "uuid",
  "status": "cancelled",
  "cancelled_at": "2024-01-01T00:00:00Z"
  // ... other fields
}
```

**Errors:**

- `400`: Cannot cancel (already completed/failed/cancelled)
- `404`: Request not found or doesn't belong to user

---

## Authentication

All endpoints require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <your_supabase_jwt>
```

The user ID is extracted from the JWT and used to enforce RLS policies.

## Idempotency

Create endpoints (`exports-create` and `deletion-requests-create`) support idempotency keys to prevent duplicate operations:

```
Idempotency-Key: my-unique-operation-id
```

If the same key is sent within 24 hours, the original response is returned without creating a new resource.

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details" // optional
}
```

Common status codes:

- `400`: Bad request (invalid input)
- `401`: Unauthorized (missing/invalid JWT)
- `404`: Resource not found or access denied
- `405`: Method not allowed
- `500`: Internal server error

## Environment Variables

Required in Netlify environment:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Database Tables

### `export_jobs`

- Users can insert and read their own jobs
- Status updates are service-role only

### `deletion_requests`

- Users can insert and read their own requests
- Status updates are service-role only (except cancel)

### `idempotency_keys`

- Automatically managed by the API
- Keys expire after 24 hours

## Shared Utilities

Located in `netlify/functions/_shared/`:

- **types.ts**: TypeScript type definitions
- **supabase.ts**: Supabase client initialization
  - `getServiceClient()`: Service role client (bypasses RLS)
  - `getUserClient(jwt)`: User-scoped client (enforces RLS)
- **auth.ts**: Authentication helpers
  - `verifySupabaseUser(event)`: Verifies JWT and returns user ID
  - `extractToken(event)`: Extracts JWT from headers
- **idempotency.ts**: Idempotency key handling
  - `checkIdempotencyKey()`: Check for existing operation
  - `storeIdempotencyKey()`: Store operation result

## Testing

Example using `curl`:

```bash
# Get your JWT token from Supabase (e.g., from browser devtools)
TOKEN="your_jwt_token"

# Create export job
curl -X POST https://your-site.netlify.app/.netlify/functions/v1-privacy-exports-create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"export_format": "json"}'

# Get export job status
curl https://your-site.netlify.app/.netlify/functions/v1-privacy-exports-get/JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```
