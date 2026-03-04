/**
 * POST /v1/privacy/deletion-requests
 * Create a new deletion request
 */

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import {
  verifySupabaseUser,
  getServiceClient,
  checkIdempotencyKey,
  storeIdempotencyKey,
  CreateDeletionRequest,
  CreateDeletionResponse,
  ErrorResponse,
} from './_shared';

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
    };
  }

  try {
    // Verify user authentication
    const userId = await verifySupabaseUser(event);

    // Check for idempotency key
    let cachedResponse;
    try {
      cachedResponse = await checkIdempotencyKey(event, userId, 'deletion-requests');
    } catch (idempotencyError) {
      if ((idempotencyError as Error).message === 'idempotency_key_payload_mismatch') {
        return {
          statusCode: 409,
          body: JSON.stringify({
            error: 'Idempotency key reuse with different request payload',
          } as ErrorResponse),
        };
      }
      throw idempotencyError;
    }
    if (cachedResponse) {
      return {
        statusCode: 200,
        body: JSON.stringify(cachedResponse),
      };
    }

    // Parse and validate request body
    let requestBody: CreateDeletionRequest = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid JSON in request body' } as ErrorResponse),
        };
      }
    }

    // Create deletion request
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('deletion_requests')
      .insert({
        user_id: userId,
        metadata: requestBody.metadata || null,
      })
      .select('id, status')
      .single();

    if (error || !data) {
      console.error('Failed to create deletion request:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to create deletion request',
          // A-7: error detail logged server-side only
        } as ErrorResponse),
      };
    }

    const response: CreateDeletionResponse = {
      request_id: data.id,
      status: data.status,
    };

    // Store idempotency key if present
    try {
      await storeIdempotencyKey(event, userId, 'deletion-requests', response);
    } catch (idempotencyError) {
      if ((idempotencyError as Error).message === 'idempotency_key_payload_mismatch') {
        return {
          statusCode: 409,
          body: JSON.stringify({
            error: 'Idempotency key reuse with different request payload',
          } as ErrorResponse),
        };
      }
      throw idempotencyError;
    }

    return {
      statusCode: 201,
      body: JSON.stringify(response),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    const error = err as Error;
    console.error('Deletion request creation error:', error);

    // Handle authentication errors
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' } as ErrorResponse),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        // A-7: error detail logged server-side only
      } as ErrorResponse),
    };
  }
};
