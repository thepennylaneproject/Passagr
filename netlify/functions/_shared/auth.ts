/**
 * Authentication utilities for Netlify Functions
 */

import type { HandlerEvent } from '@netlify/functions';
import { getServiceClient } from './supabase';

/**
 * Verifies the Supabase JWT token from the Authorization header
 * and returns the authenticated user's ID.
 * 
 * @param event - Netlify function event
 * @returns User ID from the verified JWT
 * @throws Error if authorization fails
 */
export async function verifySupabaseUser(event: HandlerEvent): Promise<string> {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Invalid Authorization header format');
  }

  // Verify the JWT using Supabase's built-in verification
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }

  return data.user.id;
}

/**
 * Extracts the JWT token from the Authorization header without verification.
 * Used when you need the raw token to create a user-scoped client.
 * 
 * @param event - Netlify function event
 * @returns JWT token string
 * @throws Error if authorization header is missing or invalid
 */
export function extractToken(event: HandlerEvent): string {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Invalid Authorization header format');
  }

  return token;
}
