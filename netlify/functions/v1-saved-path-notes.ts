import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import {
  extractToken,
  getUserClient,
  verifySupabaseUser,
} from './_shared';
import { decryptForUser, encryptForUser } from '../../src/server/crypto/envelope';

type NoteRow = {
  id: string;
  saved_path_id: string;
  title: string | null;
  body_ciphertext: string;
  body_nonce: string;
  body_key_version: number;
  created_at: string;
  updated_at: string;
};

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    const userId = await verifySupabaseUser(event);
    const token = extractToken(event);

    if (event.httpMethod === 'GET') {
      return await listNotes(event, token, userId);
    }

    if (event.httpMethod === 'POST') {
      return await createNote(event, token, userId);
    }

    if (event.httpMethod === 'PATCH') {
      return await updateNote(event, token, userId);
    }

    if (event.httpMethod === 'DELETE') {
      return await deleteNote(event, token);
    }

    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    const error = err as Error;

    if (error.message === 'invalid_json') {
      return json(400, { error: 'Invalid JSON in request body' });
    }

    if (error.message.includes('Authorization') || error.message.includes('token')) {
      return json(401, { error: 'Authentication required' });
    }

    console.error('saved path notes error:', err);
    return json(500, { error: 'Internal server error' });
  }
};

async function listNotes(event: HandlerEvent, token: string, userId: string): Promise<HandlerResponse> {
  const savedPathId = event.queryStringParameters?.saved_path_id;
  if (!savedPathId) {
    return json(400, { error: 'saved_path_id is required' });
  }

  const supabase = getUserClient(token);
  const { data, error } = await supabase
    .from('user_saved_path_notes')
    .select('id, saved_path_id, title, body_ciphertext, body_nonce, body_key_version, created_at, updated_at')
    .eq('saved_path_id', savedPathId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('list notes failed:', error);
    return json(500, { error: 'Failed to list notes' });
  }

  const notes = await Promise.all(
    (data ?? []).map(async (row) => decryptNoteRow(row as NoteRow, userId))
  );

  return json(200, notes);
}

async function createNote(event: HandlerEvent, token: string, userId: string): Promise<HandlerResponse> {
  const body = parseJsonBody(event);
  const savedPathId = stringOrNull(body.saved_path_id);
  const noteBody = stringOrNull(body.body);
  const title = stringOrNull(body.title);

  if (!savedPathId || !noteBody) {
    return json(400, { error: 'saved_path_id and body are required' });
  }

  const encrypted = await encryptForUser(userId, noteBody);

  const supabase = getUserClient(token);
  const { data, error } = await supabase
    .from('user_saved_path_notes')
    .insert({
      saved_path_id: savedPathId,
      user_id: userId,
      title,
      body_ciphertext: toByteaLiteral(encrypted.ciphertext),
      body_nonce: toByteaLiteral(encrypted.nonce),
      body_key_version: encrypted.key_version,
    })
    .select('id, saved_path_id, title, body_ciphertext, body_nonce, body_key_version, created_at, updated_at')
    .single();

  if (error || !data) {
    console.error('create note failed:', error);
    return json(500, { error: 'Failed to create note' });
  }

  return json(201, await decryptNoteRow(data as NoteRow, userId));
}

async function updateNote(event: HandlerEvent, token: string, userId: string): Promise<HandlerResponse> {
  const noteId = noteIdFromPath(event.path);
  if (!noteId) {
    return json(400, { error: 'note id is required' });
  }

  const body = parseJsonBody(event);
  const title = stringOrNull(body.title);
  const nextBody = stringOrNull(body.body);

  const updatePayload: Record<string, unknown> = {
    title,
  };

  if (nextBody) {
    const encrypted = await encryptForUser(userId, nextBody);
    updatePayload.body_ciphertext = toByteaLiteral(encrypted.ciphertext);
    updatePayload.body_nonce = toByteaLiteral(encrypted.nonce);
    updatePayload.body_key_version = encrypted.key_version;
  }

  const supabase = getUserClient(token);
  const { data, error } = await supabase
    .from('user_saved_path_notes')
    .update(updatePayload)
    .eq('id', noteId)
    .is('deleted_at', null)
    .select('id, saved_path_id, title, body_ciphertext, body_nonce, body_key_version, created_at, updated_at')
    .single();

  if (error || !data) {
    return json(404, { error: 'Note not found' });
  }

  return json(200, await decryptNoteRow(data as NoteRow, userId));
}

async function deleteNote(event: HandlerEvent, token: string): Promise<HandlerResponse> {
  const noteId = noteIdFromPath(event.path);
  if (!noteId) {
    return json(400, { error: 'note id is required' });
  }

  const supabase = getUserClient(token);
  const { error } = await supabase
    .from('user_saved_path_notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
    .is('deleted_at', null);

  if (error) {
    return json(404, { error: 'Note not found' });
  }

  return json(200, { ok: true });
}

async function decryptNoteRow(row: NoteRow, userId: string): Promise<Record<string, unknown>> {
  const body = await decryptForUser(userId, {
    ciphertext: byteaToBase64(row.body_ciphertext),
    nonce: byteaToBase64(row.body_nonce),
    key_version: row.body_key_version,
  });

  return {
    id: row.id,
    saved_path_id: row.saved_path_id,
    title: row.title,
    body,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseJsonBody(event: HandlerEvent): Record<string, unknown> {
  if (!event.body) {
    return {};
  }
  try {
    return JSON.parse(event.body) as Record<string, unknown>;
  } catch {
    throw new Error('invalid_json');
  }
}

function noteIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const candidate = parts[parts.length - 1];
  if (!candidate || candidate === 'v1-saved-path-notes') {
    return null;
  }
  return candidate;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toByteaLiteral(base64: string): string {
  return `\\x${Buffer.from(base64, 'base64').toString('hex')}`;
}

function byteaToBase64(value: string): string {
  if (!value.startsWith('\\x')) {
    throw new Error('invalid_bytea');
  }
  return Buffer.from(value.slice(2), 'hex').toString('base64');
}

function json(statusCode: number, body: Record<string, unknown> | unknown[]): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
