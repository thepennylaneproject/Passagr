/**
 * Idempotency key handling for privacy API operations
 */

import type { HandlerEvent } from '@netlify/functions';
import { createHash } from 'node:crypto';
import { getServiceClient } from './supabase';

/**
 * Checks if an idempotency key has been used before.
 * If found, returns the stored response.
 * 
 * @param event - Netlify function event
 * @param userId - Authenticated user ID
 * @param endpoint - Endpoint identifier (e.g., 'exports', 'deletion-requests')
 * @returns Previous response if key exists, null otherwise
 */
export async function checkIdempotencyKey(
  event: HandlerEvent,
  userId: string,
  endpoint: string
): Promise<any | null> {
  const idempotencyKey = event.headers['idempotency-key'] || event.headers['Idempotency-Key'];

  if (!idempotencyKey) {
    return null;
  }

  const supabase = getServiceClient();
  const requestHash = hashRequestPayload(event, endpoint);
  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('response, request_hash')
    .eq('key', idempotencyKey)
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.request_hash && data.request_hash !== requestHash) {
    throw new Error('idempotency_key_payload_mismatch');
  }

  return data.response;
}

/**
 * Stores an idempotency key with its response.
 * 
 * @param event - Netlify function event
 * @param userId - Authenticated user ID
 * @param endpoint - Endpoint identifier
 * @param response - Response to store
 */
export async function storeIdempotencyKey(
  event: HandlerEvent,
  userId: string,
  endpoint: string,
  response: any
): Promise<void> {
  const idempotencyKey = event.headers['idempotency-key'] || event.headers['Idempotency-Key'];

  if (!idempotencyKey) {
    return;
  }

  const supabase = getServiceClient();
  const requestHash = hashRequestPayload(event, endpoint);
  const { error } = await supabase.from('idempotency_keys').insert({
    key: idempotencyKey,
    user_id: userId,
    endpoint,
    request_hash: requestHash,
    response,
  });

  if (!error) {
    return;
  }

  if (!isConflictError(error)) {
    throw error;
  }

  const { data: existing, error: existingError } = await supabase
    .from('idempotency_keys')
    .select('request_hash')
    .eq('key', idempotencyKey)
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single();

  if (existingError || !existing) {
    throw existingError ?? new Error('idempotency_key_conflict_without_record');
  }

  if (existing.request_hash !== requestHash) {
    throw new Error('idempotency_key_payload_mismatch');
  }
}

/**
 * Extracts the idempotency key from request headers.
 * 
 * @param event - Netlify function event
 * @returns Idempotency key or null if not present
 */
export function getIdempotencyKey(event: HandlerEvent): string | null {
  return event.headers['idempotency-key'] || event.headers['Idempotency-Key'] || null;
}

function hashRequestPayload(event: HandlerEvent, endpoint: string): string {
  const rawBody = event.body ?? '';
  let normalizedBody = rawBody;

  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody);
      normalizedBody = stableStringify(parsed);
    } catch {
      normalizedBody = rawBody;
    }
  }

  return createHash('sha256')
    .update(`${endpoint}:${normalizedBody}`)
    .digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function isConflictError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = String((error as { code?: unknown }).code ?? '');
  const maybeMessage = String((error as { message?: unknown }).message ?? '').toLowerCase();
  return maybeCode === '23505' || maybeMessage.includes('duplicate key');
}
