/**
 * Scheduled worker:
 * - claims the oldest export job in requested/queued (or legacy pending)
 * - transitions to running
 * - exports user-owned tables as JSON + README into a ZIP
 * - uploads ZIP to private Supabase Storage
 * - transitions to completed with 24h expiration
 */

import type { Config, Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { deflateRawSync } from 'node:zlib';
import { EXPORT_V1_SCHEMA_ID, getServiceClient, PRIVACY_EXPORT_ARTIFACTS_BUCKET } from './_shared';
import { decryptForUser } from '../../src/server/crypto/envelope';

export const config: Config = {
  schedule: '*/5 * * * *',
};

type ClaimMode = {
  claimableStatuses: string[];
  runningStatus: string;
  requeueStatus: string;
};

type ExportTableName =
  | 'user_save_contexts'
  | 'user_saved_paths'
  | 'user_saved_path_notes'
  | 'user_path_comparisons'
  | 'user_path_comparison_items'
  | 'user_path_checklists'
  | 'user_checklist_item_states'
  | 'user_checklist_timeline_events';

type ExportJobRecord = {
  id: string;
  user_id: string;
  status: string;
  export_format?: string | null;
  artifact_path?: string | null;
  file_url?: string | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type JsonObject = Record<string, unknown>;

const EXPORT_TABLES: readonly ExportTableName[] = [
  'user_save_contexts',
  'user_saved_paths',
  'user_saved_path_notes',
  'user_path_comparisons',
  'user_path_comparison_items',
  'user_path_checklists',
  'user_checklist_item_states',
  'user_checklist_timeline_events',
];

const CLAIM_MODES: readonly ClaimMode[] = [
  // New state model
  { claimableStatuses: ['requested', 'queued'], runningStatus: 'running', requeueStatus: 'queued' },
  // Backward compatibility with existing schema
  { claimableStatuses: ['pending'], runningStatus: 'in_progress', requeueStatus: 'pending' },
];

const MAX_OP_RETRIES = 3;
const MAX_JOB_RETRIES = 3;

export const handler: Handler = async (_event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const claim = await claimNextJob();
    if (!claim) {
      return json(200, { processed: false, reason: 'no_eligible_jobs' });
    }

    const { job, mode } = claim;
    try {
      const bundle = await buildExportBundle(job);
      const artifactPath = resolveArtifactPath(job);
      const uploaded = await withRetry('upload_export_zip', async () => {
        const supabase = getServiceClient();
        const { error } = await supabase.storage
          .from(PRIVACY_EXPORT_ARTIFACTS_BUCKET)
          .upload(artifactPath, bundle, {
            cacheControl: '3600',
            contentType: 'application/zip',
            upsert: false,
          });
        if (error) {
          throw error;
        }
      });
      void uploaded;

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await updateJobWithCompatColumns(job.id, mode.runningStatus, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        expires_at: expiresAt,
        failure_reason: null,
        failed_at: null,
        file_size_bytes: bundle.length,
        artifact_path: artifactPath,
        file_url: artifactPath,
      });

      console.log(`privacy export completed: job=${job.id}`);
      return json(200, { processed: true, job_id: job.id, status: 'completed' });
    } catch (err) {
      const retryCount = getRetryCount(job.metadata);
      const transient = isTransientError(err);
      const alreadyExists = isStorageObjectAlreadyExistsError(err);
      const safeFailureReason = sanitizeErrorMessage(err);

      if (!alreadyExists && transient && retryCount < MAX_JOB_RETRIES) {
        await updateJobWithCompatColumns(job.id, mode.runningStatus, {
          status: mode.requeueStatus,
          failure_reason: safeFailureReason,
          metadata: {
            ...(job.metadata ?? {}),
            export_retry_count: retryCount + 1,
            export_last_retry_at: new Date().toISOString(),
          },
        });
        console.warn(`privacy export requeued: job=${job.id} retry=${retryCount + 1}`);
        return json(200, { processed: true, job_id: job.id, status: mode.requeueStatus });
      }

      await updateJobWithCompatColumns(job.id, mode.runningStatus, {
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: safeFailureReason,
      });
      console.error(`privacy export failed: job=${job.id}`);
      return json(200, { processed: true, job_id: job.id, status: 'failed' });
    }
  } catch (err) {
    console.error(`privacy export worker error: ${sanitizeErrorMessage(err)}`);
    return json(500, { error: 'worker_failed' });
  }
};

async function claimNextJob(): Promise<{ job: ExportJobRecord; mode: ClaimMode } | null> {
  for (const mode of CLAIM_MODES) {
    const claimed = await claimNextJobForMode(mode);
    if (claimed) {
      return { job: claimed, mode };
    }
  }
  return null;
}

async function claimNextJobForMode(mode: ClaimMode): Promise<ExportJobRecord | null> {
  const supabase = getServiceClient();

  const selected = await withRetry('select_export_job', async () => {
    const { data, error } = await supabase
      .from('export_jobs')
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

  const candidate = selected[0] as ExportJobRecord;
  const claimed = await withRetry('claim_export_job', async () => {
    const { data, error } = await supabase
      .from('export_jobs')
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

    return data as ExportJobRecord | null;
  });

  return claimed;
}

async function buildExportBundle(job: ExportJobRecord): Promise<Uint8Array> {
  const exportedAt = new Date().toISOString();
  const exportData: JsonObject = {
    schema_id: EXPORT_V1_SCHEMA_ID,
    exported_at: exportedAt,
    job_id: job.id,
    user_id: job.user_id,
    tables: {},
  };

  const zipFiles: Array<{ name: string; content: string }> = [];

  for (const table of EXPORT_TABLES) {
    const rows = await fetchUserRows(table, job.user_id);
    (exportData.tables as JsonObject)[table] = rows;

    zipFiles.push({
      name: `${table}.json`,
      content: JSON.stringify(rows, null, 2),
    });
  }

  zipFiles.push({
    name: 'export.json',
    content: JSON.stringify(exportData, null, 2),
  });

  zipFiles.push({
    name: 'README.txt',
    content: buildReadmeTxt(),
  });

  return createZipArchive(zipFiles);
}

async function fetchUserRows(table: ExportTableName, userId: string): Promise<unknown[]> {
  if (table === 'user_saved_path_notes') {
    return withRetry('fetch_user_saved_path_notes', async () => {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('user_saved_path_notes')
        .select('id, saved_path_id, user_id, title, source_url, created_at, updated_at, deleted_at, body_ciphertext, body_nonce, body_key_version')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const rows = data ?? [];
      const decrypted = await Promise.all(rows.map(async (row) => {
        const cipher = row.body_ciphertext as string | null;
        const nonce = row.body_nonce as string | null;
        const keyVersion = row.body_key_version as number | null;

        let body: string | null = null;
        if (cipher && nonce && keyVersion) {
          try {
            body = await decryptForUser(userId, {
              ciphertext: byteaToBase64(cipher),
              nonce: byteaToBase64(nonce),
              key_version: keyVersion,
            });
          } catch (decryptError) {
            console.warn(`[exports-worker] failed to decrypt note id=${String(row.id)}: ${sanitizeErrorMessage(decryptError)}`);
          }
        }

        return {
          id: row.id,
          saved_path_id: row.saved_path_id,
          user_id: row.user_id,
          title: row.title,
          body,
          source_url: row.source_url,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
        };
      }));

      return decrypted;
    });
  }

  return withRetry(`fetch_${table}`, async () => {
    const supabase = getServiceClient();
    let query = supabase.from(table).select('*').eq('user_id', userId);

    if (table === 'user_path_comparison_items') {
      query = query.order('comparison_id', { ascending: true }).order('sort_order', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: true });
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data ?? [];
  });
}

function byteaToBase64(value: string): string {
  if (!value.startsWith('\\x')) {
    throw new Error('invalid_bytea');
  }
  return Buffer.from(value.slice(2), 'hex').toString('base64');
}

async function updateJobWithCompatColumns(
  jobId: string,
  expectedCurrentStatus: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = getServiceClient();
  const keysToTry = ['artifact_path', 'file_url'];
  const tried = new Set<string>();
  let currentPayload = { ...payload };

  while (true) {
    const { error } = await withRetry('update_export_job', async () => {
      return supabase
        .from('export_jobs')
        .update(currentPayload)
        .eq('id', jobId)
        .eq('status', expectedCurrentStatus);
    });

    if (!error) {
      return;
    }

    const missingKey = keysToTry.find((key) => {
      if (tried.has(key)) {
        return false;
      }
      const message = String(error.message || '');
      return message.includes(`column "${key}"`) || message.includes(`Could not find the '${key}' column`);
    });

    if (!missingKey) {
      throw error;
    }

    tried.add(missingKey);
    delete currentPayload[missingKey];
  }
}

function resolveArtifactPath(job: ExportJobRecord): string {
  const providedPath = typeof job.artifact_path === 'string' && job.artifact_path.trim().length > 0
    ? job.artifact_path.trim()
    : null;

  if (providedPath) {
    // F-07: Sanitize against path traversal
    if (
      providedPath.includes('..') ||
      providedPath.includes('\0') ||
      providedPath.startsWith('/') ||
      providedPath.startsWith('\\') ||
      /[<>"|?*]/.test(providedPath)
    ) {
      console.warn(`[exports-worker] Rejected unsafe artifact_path: ${providedPath.slice(0, 50)}`);
      // Fall through to auto-generated safe path
    } else {
      return providedPath;
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `exports/${job.user_id}/${job.id}-${timestamp}.zip`;
}

function getRetryCount(metadata: Record<string, unknown> | null | undefined): number {
  const value = metadata?.export_retry_count;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
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

function isTransientError(err: unknown): boolean {
  const message = sanitizeErrorMessage(err).toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('temporary') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('429')
  );
}

function isStorageObjectAlreadyExistsError(err: unknown): boolean {
  const message = sanitizeErrorMessage(err).toLowerCase();
  return message.includes('already exists') || message.includes('duplicate');
}

function isInvalidEnumValueError(err: unknown): boolean {
  const message = sanitizeErrorMessage(err).toLowerCase();
  return message.includes('invalid input value for enum');
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

function buildReadmeTxt(): string {
  return [
    'Passagr Privacy Export',
    '',
    `Schema: ${EXPORT_V1_SCHEMA_ID}`,
    'Format: UTF-8 JSON files in ZIP archive',
    '',
    'Files:',
    '- export.json: top-level envelope and all table data under tables.*',
    '- user_save_contexts.json',
    '- user_saved_paths.json',
    '- user_saved_path_notes.json',
    '- user_path_comparisons.json',
    '- user_path_comparison_items.json',
    '- user_path_checklists.json',
    '- user_checklist_item_states.json',
    '- user_checklist_timeline_events.json',
    '',
    'Notes:',
    '- Export includes rows scoped to one user_id.',
    '- Timestamps are ISO-8601 strings.',
    '- Null values may be present where DB values are null.',
  ].join('\n');
}

function createZipArchive(entries: Array<{ name: string; content: string }>): Uint8Array {
  const localFileChunks: Buffer[] = [];
  const centralDirectoryChunks: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8');
    const content = Buffer.from(entry.content, 'utf8');
    const compressed = deflateRawSync(content);
    const crc = crc32(content);
    const dos = toDosDateTime(new Date());

    const localHeader = Buffer.alloc(30 + nameBytes.length);
    let p = 0;
    localHeader.writeUInt32LE(0x04034b50, p); p += 4;
    localHeader.writeUInt16LE(20, p); p += 2; // version needed
    localHeader.writeUInt16LE(0, p); p += 2; // flags
    localHeader.writeUInt16LE(8, p); p += 2; // deflate
    localHeader.writeUInt16LE(dos.time, p); p += 2;
    localHeader.writeUInt16LE(dos.date, p); p += 2;
    localHeader.writeUInt32LE(crc, p); p += 4;
    localHeader.writeUInt32LE(compressed.length, p); p += 4;
    localHeader.writeUInt32LE(content.length, p); p += 4;
    localHeader.writeUInt16LE(nameBytes.length, p); p += 2;
    localHeader.writeUInt16LE(0, p); p += 2; // extra length
    nameBytes.copy(localHeader, p);

    const centralHeader = Buffer.alloc(46 + nameBytes.length);
    p = 0;
    centralHeader.writeUInt32LE(0x02014b50, p); p += 4;
    centralHeader.writeUInt16LE(20, p); p += 2; // version made by
    centralHeader.writeUInt16LE(20, p); p += 2; // version needed
    centralHeader.writeUInt16LE(0, p); p += 2; // flags
    centralHeader.writeUInt16LE(8, p); p += 2; // deflate
    centralHeader.writeUInt16LE(dos.time, p); p += 2;
    centralHeader.writeUInt16LE(dos.date, p); p += 2;
    centralHeader.writeUInt32LE(crc, p); p += 4;
    centralHeader.writeUInt32LE(compressed.length, p); p += 4;
    centralHeader.writeUInt32LE(content.length, p); p += 4;
    centralHeader.writeUInt16LE(nameBytes.length, p); p += 2;
    centralHeader.writeUInt16LE(0, p); p += 2; // extra length
    centralHeader.writeUInt16LE(0, p); p += 2; // comment length
    centralHeader.writeUInt16LE(0, p); p += 2; // disk number start
    centralHeader.writeUInt16LE(0, p); p += 2; // internal attrs
    centralHeader.writeUInt32LE(0, p); p += 4; // external attrs
    centralHeader.writeUInt32LE(offset, p); p += 4; // local header offset
    nameBytes.copy(centralHeader, p);

    localFileChunks.push(localHeader, compressed);
    centralDirectoryChunks.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralDirectoryChunks);
  const endOfCentralDir = Buffer.alloc(22);
  let p = 0;
  endOfCentralDir.writeUInt32LE(0x06054b50, p); p += 4;
  endOfCentralDir.writeUInt16LE(0, p); p += 2; // disk number
  endOfCentralDir.writeUInt16LE(0, p); p += 2; // start disk
  endOfCentralDir.writeUInt16LE(entries.length, p); p += 2;
  endOfCentralDir.writeUInt16LE(entries.length, p); p += 2;
  endOfCentralDir.writeUInt32LE(centralDirectory.length, p); p += 4;
  endOfCentralDir.writeUInt32LE(offset, p); p += 4;
  endOfCentralDir.writeUInt16LE(0, p); // comment length

  const archive = Buffer.concat([...localFileChunks, centralDirectory, endOfCentralDir]);
  return new Uint8Array(archive);
}

function toDosDateTime(date: Date): { date: number; time: number } {
  const year = Math.max(1980, date.getUTCFullYear());
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = Math.floor(date.getUTCSeconds() / 2);

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;

  return { date: dosDate, time: dosTime };
}

const CRC32_TABLE = buildCrc32Table();

function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
