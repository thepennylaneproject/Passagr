/**
 * GET /v1/privacy/deletion-requests/:id
 * Get the status of a deletion request
 */

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import {
  extractToken,
  getUserClient,
  verifySupabaseUser,
  ErrorResponse,
} from './_shared';

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
    };
  }

  try {
    // Verify user authentication
    const userId = await verifySupabaseUser(event);
    const token = extractToken(event);

    // Extract request id from path
    const requestId = event.path.split('/').pop();
    
    if (!requestId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request id in path' } as ErrorResponse),
      };
    }

    // Query deletion request with user client (RLS enforces user_id match)
    const supabase = getUserClient(token);
    const { data, error } = await supabase
      .from('deletion_requests')
      .select('id, status')
      .eq('id', requestId)
      .single();

    if (error) {
      // Check if it's a not found error
      if (error.code === 'PGRST116' || error.message.includes('no rows')) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Deletion request not found',
            details: 'Request does not exist or does not belong to you',
          } as ErrorResponse),
        };
      }

      console.error('Failed to fetch deletion request:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to fetch deletion request',
          // A-7: error detail logged server-side only
        } as ErrorResponse),
      };
    }

    if (!data) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Deletion request not found',
          details: 'Request does not exist or does not belong to you',
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
    console.error('Deletion request fetch error:', error);

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
