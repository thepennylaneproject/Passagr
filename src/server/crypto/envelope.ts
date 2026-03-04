import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
  type CipherGCMTypes,
} from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DATA_ALGORITHM: CipherGCMTypes = 'aes-256-gcm';
const WRAP_ALGORITHM: CipherGCMTypes = 'aes-256-gcm';
const NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;
const DEK_BYTES = 32;
const MAX_RETRIES = 3;

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  key_version: number;
}

type WrappedKeyRow = {
  user_id: string;
  wrapped_dek: string;
  key_version: number;
  created_at: string;
  rotated_at: string | null;
};

type KmsAdapter = {
  wrapKey: (rawDek: Uint8Array, ctx: { userId: string; keyVersion: number }) => Promise<string>;
  unwrapKey: (wrappedDek: string, ctx: { userId: string; keyVersion: number }) => Promise<Uint8Array>;
};

let serviceClient: SupabaseClient | null = null;
let kmsAdapterPromise: Promise<KmsAdapter | null> | null = null;

// SERVER ONLY: never import this file into client/browser bundles.
export async function encryptForUser(userId: string, plaintext: string): Promise<EncryptedPayload> {
  assertUserId(userId);
  const keyRow = await getOrCreateActiveUserKey(userId);
  const dek = await unwrapDek(userId, keyRow.key_version, keyRow.wrapped_dek);

  try {
    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv(DATA_ALGORITHM, dek, nonce);
    cipher.setAAD(Buffer.from(`${userId}:${keyRow.key_version}`, 'utf8'));

    const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
    const tag = cipher.getAuthTag();
    const packed = Buffer.concat([encrypted, tag]);

    return {
      ciphertext: toBase64(packed),
      nonce: toBase64(nonce),
      key_version: keyRow.key_version,
    };
  } finally {
    dek.fill(0);
  }
}

// SERVER ONLY: never import this file into client/browser bundles.
export async function decryptForUser(userId: string, payload: EncryptedPayload): Promise<string> {
  assertUserId(userId);
  validatePayload(payload);

  const keyRow = await getUserKeyByVersion(userId, payload.key_version);
  if (!keyRow) {
    throw new Error('missing_wrapped_dek_for_version');
  }

  const dek = await unwrapDek(userId, keyRow.key_version, keyRow.wrapped_dek);
  try {
    const nonce = fromBase64(payload.nonce);
    const packed = fromBase64(payload.ciphertext);
    if (packed.length < GCM_TAG_BYTES) {
      throw new Error('invalid_ciphertext_payload');
    }

    const ciphertext = packed.subarray(0, packed.length - GCM_TAG_BYTES);
    const authTag = packed.subarray(packed.length - GCM_TAG_BYTES);

    const decipher = createDecipheriv(DATA_ALGORITHM, dek, nonce);
    decipher.setAAD(Buffer.from(`${userId}:${payload.key_version}`, 'utf8'));
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch {
    throw new Error('decrypt_failed');
  } finally {
    dek.fill(0);
  }
}

/**
 * Adds a new wrapped DEK version for the user and marks the previous active key rotated.
 * Re-encryption of existing rows should happen in a separate background job.
 */
export async function rotateUserDek(userId: string): Promise<number> {
  assertUserId(userId);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const latest = await getLatestUserKey(userId);
    const nextVersion = (latest?.key_version ?? 0) + 1;
    const dek = randomBytes(DEK_BYTES);

    try {
      const wrappedDek = await wrapDek(userId, nextVersion, dek);

      if (latest && latest.rotated_at == null) {
        const supabase = getServiceClient();
        const { error: rotateError } = await supabase
          .from('user_wrapped_keys')
          .update({ rotated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('key_version', latest.key_version)
          .is('rotated_at', null);

        if (rotateError) {
          throw rotateError;
        }
      }

      const supabase = getServiceClient();
      const { error: insertError } = await supabase.from('user_wrapped_keys').insert({
        user_id: userId,
        wrapped_dek: wrappedDek,
        key_version: nextVersion,
      });

      if (!insertError) {
        return nextVersion;
      }

      if (!isConflictError(insertError) || attempt === MAX_RETRIES) {
        throw insertError;
      }
    } finally {
      dek.fill(0);
    }
  }

  throw new Error('rotate_user_dek_failed');
}

async function getOrCreateActiveUserKey(userId: string): Promise<WrappedKeyRow> {
  const existing = await getActiveUserKey(userId);
  if (existing) {
    return existing;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const dek = randomBytes(DEK_BYTES);
    try {
      const wrappedDek = await wrapDek(userId, 1, dek);
      const supabase = getServiceClient();
      const { error: insertError } = await supabase.from('user_wrapped_keys').insert({
        user_id: userId,
        wrapped_dek: wrappedDek,
        key_version: 1,
      });

      if (!insertError) {
        const created = await getActiveUserKey(userId);
        if (created) {
          return created;
        }
      } else if (!isConflictError(insertError) || attempt === MAX_RETRIES) {
        throw insertError;
      }

      const concurrent = await getActiveUserKey(userId);
      if (concurrent) {
        return concurrent;
      }
    } finally {
      dek.fill(0);
    }
  }

  throw new Error('failed_to_create_user_dek');
}

async function getActiveUserKey(userId: string): Promise<WrappedKeyRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('user_wrapped_keys')
    .select('*')
    .eq('user_id', userId)
    .is('rotated_at', null)
    .order('key_version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WrappedKeyRow | null) ?? null;
}

async function getLatestUserKey(userId: string): Promise<WrappedKeyRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('user_wrapped_keys')
    .select('*')
    .eq('user_id', userId)
    .order('key_version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WrappedKeyRow | null) ?? null;
}

async function getUserKeyByVersion(userId: string, keyVersion: number): Promise<WrappedKeyRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('user_wrapped_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('key_version', keyVersion)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WrappedKeyRow | null) ?? null;
}

async function wrapDek(userId: string, keyVersion: number, dek: Uint8Array): Promise<string> {
  const kms = await getKmsAdapter();
  if (kms) {
    return kms.wrapKey(dek, { userId, keyVersion });
  }

  const kek = getMasterKek();
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(WRAP_ALGORITHM, kek, nonce);
  cipher.setAAD(Buffer.from(`${userId}:${keyVersion}`, 'utf8'));

  const encrypted = Buffer.concat([cipher.update(Buffer.from(dek)), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload = {
    alg: WRAP_ALGORITHM,
    nonce: toBase64(nonce),
    ciphertext: toBase64(encrypted),
    tag: toBase64(tag),
  };

  return `local:${toBase64(Buffer.from(JSON.stringify(payload), 'utf8'))}`;
}

async function unwrapDek(userId: string, keyVersion: number, wrappedDek: string): Promise<Buffer> {
  // F-05: Validate wrappedDek format before any processing
  if (!wrappedDek || typeof wrappedDek !== 'string' || wrappedDek.length === 0) {
    throw new Error('invalid_wrapped_dek');
  }
  if (!wrappedDek.startsWith('local:') && !/^[A-Za-z0-9+/=]+$/.test(wrappedDek)) {
    throw new Error('invalid_wrapped_dek_format');
  }

  const kms = await getKmsAdapter();
  if (kms && !wrappedDek.startsWith('local:')) {
    return Buffer.from(await kms.unwrapKey(wrappedDek, { userId, keyVersion }));
  }

  if (!wrappedDek.startsWith('local:')) {
    throw new Error('kms_required_for_wrapped_dek');
  }

  const encoded = wrappedDek.slice('local:'.length);
  const decoded = JSON.parse(fromBase64(encoded).toString('utf8')) as {
    alg: CipherGCMTypes;
    nonce: string;
    ciphertext: string;
    tag: string;
  };

  if (decoded.alg !== WRAP_ALGORITHM) {
    throw new Error('unsupported_wrapped_dek_algorithm');
  }

  const kek = getMasterKek();
  const nonce = fromBase64(decoded.nonce);
  const ciphertext = fromBase64(decoded.ciphertext);
  const tag = fromBase64(decoded.tag);

  const decipher = createDecipheriv(WRAP_ALGORITHM, kek, nonce);
  decipher.setAAD(Buffer.from(`${userId}:${keyVersion}`, 'utf8'));
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

async function getKmsAdapter(): Promise<KmsAdapter | null> {
  if (!kmsAdapterPromise) {
    kmsAdapterPromise = loadKmsAdapter();
  }
  return kmsAdapterPromise;
}

// F-01: Allowlist of valid KMS adapter modules — never pass env vars directly to import()
const ALLOWED_KMS_ADAPTERS: Record<string, string> = {
  local: './kms-local.js',
  // Add other allowed adapter identifiers here, e.g.:
  // 'aws-kms': './kms-aws.js',
  // 'gcp-kms': './kms-gcp.js',
};

async function loadKmsAdapter(): Promise<KmsAdapter | null> {
  const adapterName = process.env.ENVELOPE_KMS_ADAPTER;
  if (!adapterName) {
    return null;
  }

  const resolvedPath = ALLOWED_KMS_ADAPTERS[adapterName];
  if (!resolvedPath) {
    console.error(`[envelope] Blocked unknown KMS adapter: "${adapterName}". Allowed: ${Object.keys(ALLOWED_KMS_ADAPTERS).join(', ')}`);
    return null;
  }

  const imported = await import(resolvedPath);
  const adapter = (imported?.default ?? imported) as Partial<KmsAdapter>;
  if (typeof adapter.wrapKey !== 'function' || typeof adapter.unwrapKey !== 'function') {
    throw new Error('invalid_kms_adapter');
  }

  return adapter as KmsAdapter;
}

function getMasterKek(): Buffer {
  const raw = process.env.ENVELOPE_MASTER_KEY;
  if (!raw) {
    throw new Error('ENVELOPE_MASTER_KEY is required when no KMS adapter is configured');
  }

  let keyMaterial: Buffer;
  if (/^[A-Fa-f0-9]+$/.test(raw) && raw.length % 2 === 0) {
    keyMaterial = Buffer.from(raw, 'hex');
  } else if (looksLikeBase64(raw)) {
    keyMaterial = Buffer.from(raw, 'base64');
  } else {
    keyMaterial = Buffer.from(raw, 'utf8');
  }

  const salt = process.env.ENVELOPE_MASTER_KEY_SALT || 'passagr-envelope-kek-v1';
  const iterationsRaw = Number.parseInt(process.env.ENVELOPE_MASTER_KEY_KDF_ITERATIONS || '210000', 10);
  const iterations = Number.isFinite(iterationsRaw) && iterationsRaw >= 100000 ? iterationsRaw : 210000;
  return pbkdf2Sync(keyMaterial, salt, iterations, 32, 'sha256');
}

function validatePayload(payload: EncryptedPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new Error('invalid_encrypted_payload');
  }
  if (!payload.ciphertext || !payload.nonce || !Number.isInteger(payload.key_version)) {
    throw new Error('invalid_encrypted_payload');
  }
}

function assertUserId(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new Error('invalid_user_id');
  }
}

function isConflictError(err: unknown): boolean {
  const message = toErrorMessage(err).toLowerCase();
  return message.includes('duplicate key') || message.includes('conflict');
}

function toErrorMessage(err: unknown): string {
  if (!err) {
    return 'unknown_error';
  }
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message?: unknown }).message ?? 'error');
  }
  return 'error';
}

function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

function fromBase64(value: string): Buffer {
  return Buffer.from(value, 'base64');
}

function looksLikeBase64(value: string): boolean {
  return value.length >= 16 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function getServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return serviceClient;
}
