/**
 * Scheduled deletion worker.
 *
 * Deletion order (intentional for FK safety and resumability):
 * 1) Revoke user sessions (Supabase Admin API).
 * 2) Delete export artifacts from Storage.
 * 3) Delete wrapped encryption keys (if such tables exist).
 * 4) Hard-delete user-owned application rows.
 * 5) Finalize auth identity (soft-delete metadata by default; optional hard delete).
 * 6) Mark request completed.
 */

import type { Config, Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { getServiceClient, PRIVACY_EXPORT_ARTIFACTS_BUCKET } from './_shared';

export const config: Config = {
  schedule: '*/5 * * * *',
};

type ClaimMode = {
  claimableStatuses: string[];
  runningStatus: string;
  requeueStatus: string;
};

type DeletionRequestRecord = {
  id: string;
  user_id: string;
  status: string;
  metadata?: Record<string, unknown> | null;
};

const CLAIM_MODES: readonly ClaimMode[] = [
  { claimableStatuses: ['requested', 'queued'], runningStatus: 'running', requeueStatus: 'queued' },
  { claimableStatuses: ['pending'], runningStatus: 'in_progress', requeueStatus: 'pending' },
];

const WRAPPED_KEY_TABLE_CANDIDATES = [
  'user_wrapped_keys',
  'wrapped_encryption_keys',
  'user_encryption_keys',
] as const;

const USER_TABLE_DELETE_ORDER = [
  'user_checklist_timeline_events',
  'user_checklist_item_states',
  'user_path_checklists',
  'user_path_comparison_items',
  'user_saved_path_notes',
  'user_path_comparisons',
  'user_saved_paths',
  'user_save_contexts',
  'idempotency_keys',
  'export_jobs',
] as const;

const MAX_OP_RETRIES = 3;
const MAX_REQUEST_RETRIES = 3;

export const handler: Handler = async (_event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const claim = await claimNextDeletionRequest();
    if (!claim) {
      return json(200, { processed: false, reason: 'no_eligible_requests' });
    }

    const { request, mode } = claim;

    try {
      await runDeletionFlow(request);
      await updateRequestStatus(request.id, mode.runningStatus, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        failed_at: null,
        failure_reason: null,
      });
      return json(200, { processed: true, request_id: request.id, status: 'completed' });
    } catch (err) {
      const transient = isTransientError(err);
      const retryCount = getRetryCount(request.metadata);
      const safeFailureReason = sanitizeErrorMessage(err);

      if (transient && retryCount < MAX_REQUEST_RETRIES) {
        await updateRequestStatus(request.id, mode.runningStatus, {
          status: mode.requeueStatus,
          failure_reason: safeFailureReason,
          metadata: {
            ...(request.metadata ?? {}),
            deletion_retry_count: retryCount + 1,
            deletion_last_retry_at: new Date().toISOString(),
          },
        });
        await insertDeletionEvent(request.id, request.user_id, 'request_requeued', {
          retry_count: retryCount + 1,
        });
        return json(200, { processed: true, request_id: request.id, status: mode.requeueStatus });
      }

      await updateRequestStatus(request.id, mode.runningStatus, {
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: safeFailureReason,
      });
      await insertDeletionEvent(request.id, request.user_id, 'request_failed', {
        reason: safeFailureReason,
      });
      return json(200, { processed: true, request_id: request.id, status: 'failed' });
    }
  } catch (err) {
    console.error(`deletion worker error: ${sanitizeErrorMessage(err)}`);
    return json(500, { error: 'worker_failed' });
  }
};

async function claimNextDeletionRequest(): Promise<{ request: DeletionRequestRecord; mode: ClaimMode } | null> {
  for (const mode of CLAIM_MODES) {
    const claimed = await claimForMode(mode);
    if (claimed) {
      return { request: claimed, mode };
    }
  }
  return null;
}

async function claimForMode(mode: ClaimMode): Promise<DeletionRequestRecord | null> {
  const supabase = getServiceClient();
  const selected = await withRetry('select_deletion_request', async () => {
    const { data, error } = await supabase
      .from('deletion_requests')
      .select('*')
      .in('status', mode.claimableStatuses)
      .order('requested_at', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      if (isInvalidEnumValueError(error)) {
        return [];
      }
      throw error;
    }

    return data ?? [];
  });

  if (!selected.length) {
    return null;
  }

  const candidate = selected[0] as DeletionRequestRecord;
  const claimed = await withRetry('claim_deletion_request', async () => {
    const { data, error } = await supabase
      .from('deletion_requests')
      .update({
        status: mode.runningStatus,
        started_at: new Date().toISOString(),
        failed_at: null,
        failure_reason: null,
      })
      .eq('id', candidate.id)
      .in('status', mode.claimableStatuses)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isInvalidEnumValueError(error)) {
        return null;
      }
      throw error;
    }

    return data as DeletionRequestRecord | null;
  });

  return claimed;
}

async function runDeletionFlow(request: DeletionRequestRecord): Promise<void> {
  await runStep(request, 'revoke_sessions', async () => {
    await revokeSessionsViaAdminApi(request.user_id);
    return {};
  });

  await runStep(request, 'delete_export_storage_objects', async () => {
    const removed = await deleteExportArtifactsForUser(request.user_id);
    return { removed_objects: removed };
  });

  await runStep(request, 'delete_wrapped_encryption_keys', async () => {
    const deleted = await deleteOptionalWrappedKeys(request.user_id);
    return { rows_deleted: deleted };
  });

  await runStep(request, 'delete_user_application_rows', async () => {
    const deletedCounts: Record<string, number | null> = {};
    for (const table of USER_TABLE_DELETE_ORDER) {
      const count = await hardDeleteByUser(table, request.user_id);
      deletedCounts[table] = count;
    }
    return { deleted_counts: deletedCounts };
  });

  await runStep(request, 'finalize_auth_identity', async () => {
    const hardDelete = process.env.PRIVACY_DELETE_AUTH_USER === 'true';
    const action = await finalizeAuthIdentity(request.user_id, hardDelete);
    return { action };
  });
}

async function runStep(
  request: DeletionRequestRecord,
  step: string,
  task: () => Promise<Record<string, unknown>>
): Promise<void> {
  const completedEventType = `step_completed:${step}`;
  const alreadyDone = await hasEvent(request.id, completedEventType);
  if (alreadyDone) {
    return;
  }

  await insertDeletionEvent(request.id, request.user_id, `step_started:${step}`);
  try {
    const details = await task();
    await insertDeletionEvent(request.id, request.user_id, completedEventType, details);
  } catch (err) {
    await insertDeletionEvent(request.id, request.user_id, `step_failed:${step}`, {
      reason: sanitizeErrorMessage(err),
    });
    throw err;
  }
}

async function hasEvent(deletionRequestId: string, eventType: string): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await withRetry('has_deletion_event', async () => {
    return supabase
      .from('deletion_events')
      .select('id')
      .eq('deletion_request_id', deletionRequestId)
      .eq('event_type', eventType)
      .limit(1)
      .maybeSingle();
  });

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
}

async function insertDeletionEvent(
  deletionRequestId: string,
  userId: string,
  eventType: string,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = getServiceClient();
  await withRetry('insert_deletion_event', async () => {
    const { error } = await supabase.from('deletion_events').insert({
      deletion_request_id: deletionRequestId,
      user_id: userId,
      event_type: eventType,
      details: details ?? null,
    });

    if (error) {
      throw error;
    }
  });
}

async function revokeSessionsViaAdminApi(userId: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('missing_supabase_env_for_admin_api');
  }

  const endpoint = `${supabaseUrl}/auth/v1/admin/users/${userId}/logout`;
  await withRetry('revoke_sessions_admin_api', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    // User may already be gone; treat as idempotent success.
    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`session_revoke_failed:${response.status}:${text.slice(0, 120)}`);
    }
  });
}

async function deleteExportArtifactsForUser(userId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await withRetry('load_export_artifacts', async () => {
    return supabase
      .from('export_jobs')
      .select('artifact_path,file_url')
      .eq('user_id', userId);
  });

  if (error) {
    throw error;
  }

  const paths = new Set<string>();
  for (const row of data ?? []) {
    const artifact = typeof row.artifact_path === 'string' ? row.artifact_path.trim() : '';
    const fileUrl = typeof row.file_url === 'string' ? row.file_url.trim() : '';
    if (artifact) {
      paths.add(artifact);
    }
    if (fileUrl) {
      const parsed = parseStoragePath(fileUrl, PRIVACY_EXPORT_ARTIFACTS_BUCKET);
      if (parsed) {
        paths.add(parsed);
      }
    }
  }

  const candidates = Array.from(paths);
  if (!candidates.length) {
    return 0;
  }

  let removedCount = 0;
  const chunkSize = 100;
  for (let i = 0; i < candidates.length; i += chunkSize) {
    const chunk = candidates.slice(i, i + chunkSize);
    await withRetry('remove_storage_objects', async () => {
      const { error: removeError } = await supabase.storage
        .from(PRIVACY_EXPORT_ARTIFACTS_BUCKET)
        .remove(chunk);

      if (removeError) {
        throw removeError;
      }
      removedCount += chunk.length;
    });
  }

  return removedCount;
}

function parseStoragePath(value: string, bucket: string): string | null {
  if (!value) {
    return null;
  }

  if (!value.includes('://')) {
    return value.replace(/^\/+/, '');
  }

  try {
    const url = new URL(value);
    const marker = `/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx >= 0) {
      return decodeURIComponent(url.pathname.slice(idx + marker.length)).replace(/^\/+/, '');
    }
    return null;
  } catch {
    return null;
  }
}

async function deleteOptionalWrappedKeys(userId: string): Promise<number> {
  let total = 0;
  for (const table of WRAPPED_KEY_TABLE_CANDIDATES) {
    try {
      const count = await hardDeleteByUser(table, userId);
      total += count ?? 0;
    } catch (err) {
      if (isMissingTableError(err)) {
        continue;
      }
      throw err;
    }
  }
  return total;
}

async function hardDeleteByUser(table: string, userId: string): Promise<number | null> {
  const supabase = getServiceClient();
  const { count, error } = await withRetry(`delete_${table}`, async () => {
    return supabase.from(table).delete({ count: 'exact' }).eq('user_id', userId);
  });

  if (error) {
    throw error;
  }

  return count ?? null;
}

async function finalizeAuthIdentity(userId: string, hardDelete: boolean): Promise<'hard_deleted' | 'soft_deleted' | 'already_deleted'> {
  const supabase = getServiceClient();

  const { data: existing, error: existingError } = await withRetry('admin_get_user', async () => {
    return supabase.auth.admin.getUserById(userId);
  });

  if (existingError) {
    if (isAuthUserNotFound(existingError)) {
      return 'already_deleted';
    }
    throw existingError;
  }

  if (!existing?.user) {
    return 'already_deleted';
  }

  if (hardDelete) {
    const { error: deleteError } = await withRetry('admin_delete_user', async () => {
      return supabase.auth.admin.deleteUser(userId);
    });

    if (deleteError && !isAuthUserNotFound(deleteError)) {
      throw deleteError;
    }
    return 'hard_deleted';
  }

  const userMetadata = {
    ...(existing.user.user_metadata ?? {}),
    privacy_deleted: true,
    privacy_deleted_at: new Date().toISOString(),
  };

  const { error: updateError } = await withRetry('admin_soft_delete_user', async () => {
    return supabase.auth.admin.updateUserById(userId, {
      user_metadata: userMetadata,
    });
  });

  if (updateError && !isAuthUserNotFound(updateError)) {
    throw updateError;
  }

  return 'soft_deleted';
}

async function updateRequestStatus(
  requestId: string,
  expectedCurrentStatus: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = getServiceClient();
  await withRetry('update_deletion_request', async () => {
    const { error } = await supabase
      .from('deletion_requests')
      .update(payload)
      .eq('id', requestId)
      .eq('status', expectedCurrentStatus);

    if (error) {
      throw error;
    }
  });
}

function getRetryCount(metadata: Record<string, unknown> | null | undefined): number {
  const value = metadata?.deletion_retry_count;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isAuthUserNotFound(err: unknown): boolean {
  const message = sanitizeErrorMessage(err).toLowerCase();
  return message.includes('user not found') || message.includes('not found');
}

function isMissingTableError(err: unknown): boolean {
  const message = sanitizeErrorMessage(err).toLowerCase();
  return (
    message.includes('relation') && message.includes('does not exist')
  ) || message.includes('could not find the');
}

function isInvalidEnumValueError(err: unknown): boolean {
  return sanitizeErrorMessage(err).toLowerCase().includes('invalid input value for enum');
}

function isTransientError(err: unknown): boolean {
  const message = sanitizeErrorMessage(err).toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('temporary') ||
    message.includes('connection terminated') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('429')
  );
}

function sanitizeErrorMessage(err: unknown): string {
  if (!err) {
    return 'unknown_error';
  }

  const message =
    typeof err === 'string'
      ? err
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: unknown }).message ?? 'error')
        : 'error';

  return message.replace(/\s+/g, ' ').slice(0, 300);
}

async function withRetry<T>(label: string, operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_OP_RETRIES) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      attempt += 1;
      if (attempt >= MAX_OP_RETRIES || !isTransientError(err)) {
        break;
      }
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 5000) + Math.floor(Math.random() * 200);
      console.warn(`retrying operation=${label} attempt=${attempt}`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(statusCode: number, body: Record<string, unknown>): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
