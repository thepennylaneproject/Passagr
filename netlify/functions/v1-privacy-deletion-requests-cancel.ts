/**
 * POST /v1/privacy/deletion-requests/:id/cancel
 * Cancel a pending deletion request
 */

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import {
  verifySupabaseUser,
  getServiceClient,
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

    // Extract request id from path
    // Supports both:
    // - /.netlify/functions/v1-privacy-deletion-requests-cancel/REQUEST_ID
    // - /v1/privacy/deletion-requests/REQUEST_ID/cancel (redirected)
    const pathParts = event.path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const requestId = lastPart === 'cancel' ? pathParts[pathParts.length - 2] : lastPart;
    
    if (!requestId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request id in path' } as ErrorResponse),
      };
    }

    // Use service client to update the deletion request
    const supabase = getServiceClient();

    // F-06: Atomic cancel — single UPDATE with status check in WHERE clause
    // Eliminates the TOCTOU race where status could change between SELECT and UPDATE
    const { data, error } = await supabase
      .from('deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select('id, status')
      .single();

    if (error || !data) {
      const { data: existing, error: existingError } = await supabase
        .from('deletion_requests')
        .select('id')
        .eq('id', requestId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingError && existing) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            error: 'Request can no longer be cancelled',
          } as ErrorResponse),
        };
      }

      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Request not found or cannot be cancelled',
        } as ErrorResponse),
      };
    }

    const response = {
      request_id: data.id,
      status: data.status,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    const error = err as Error;
    console.error('Deletion request cancellation error:', error);

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
